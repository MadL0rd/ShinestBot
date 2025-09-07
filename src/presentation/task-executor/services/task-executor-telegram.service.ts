import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import ApiClient from 'node_modules/telegraf/typings/core/network/client'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { TelegramBridgeFactoryService } from 'src/business-logic/telegram-bridge/telegram-bridge-factory/telegram-bridge-factory.service'
import { UserService } from 'src/business-logic/user/user.service'
import { ChainTask } from 'src/entities/chain-task'
import { UserProfile } from 'src/entities/user-profile'
import { PrivateDialogDispatcherService } from 'src/presentation/dispatchers/services/private-dialog-dispatcher.service'
import { SceneName } from 'src/presentation/scenes/models/scene-name.enum'
import { getSendMessageErrorType } from 'src/presentation/utils/get-send-message-error-type.utils'
import { Telegraf } from 'telegraf'
import { ChainTaskExecutor } from '../abstractions/chain-task-executor'

@Injectable()
export class TaskExecutorTelegramService implements ChainTaskExecutor<'telegram'> {
    constructor(
        @InjectBot('Bot') private readonly bot: Telegraf,
        @InjectBot('Bot') private readonly serviceBot: Telegraf,
        private readonly userService: UserService,
        private readonly privateDialogDispatcher: PrivateDialogDispatcherService,
        private readonly telegramBridgeFactoryService: TelegramBridgeFactoryService
    ) {}

    async createTopic(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'createTopic'>
    ): Promise<boolean> {
        const topic = await this.createUserTopic(user, action.topicType)

        switch (action.topicType) {
            case 'default':
                if (user.telegramTopic) {
                    user.telegramTopicHistory.push(user.telegramTopic)
                    user.telegramTopicHistory =
                        user.telegramTopicHistory.length > 5
                            ? user.telegramTopicHistory.slice(-5)
                            : user.telegramTopicHistory
                }
                user.telegramTopic = topic
                await this.userService.update(user, ['telegramTopic', 'telegramTopicHistory'])
                break
        }

        return true
    }

    async sendMessage(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'sendMessage'>
    ): Promise<boolean> {
        if (
            (user.telegramUserIsDeactivated || user.isBotBlocked) &&
            action.dialogType === 'privateDialog'
        ) {
            return true
        }

        const apiCallOpts = this.extractSendMessageActionTelegramCallOptions(user, action)

        switch (action.data.type) {
            case 'text': {
                if (action.data.text.length > 4096) {
                    logger.error(
                        `User ${user.telegramId} task warning. Message text length is ${action.data.text.length} but max telegram message length is 4096`
                    )
                    action.data.text = action.data.text.slice(0, 4096)
                }
                return apiCallOpts.sender
                    .callApi('sendMessage', {
                        ...apiCallOpts.targetArgs,
                        text: action.data.text,
                        parse_mode: action.data.parseMode ?? 'HTML',
                    })
                    .then(() => true)
            }

            case 'video':
                return apiCallOpts.sender
                    .callApi('sendVideo', {
                        ...apiCallOpts.targetArgs,
                        video: action.data.videoId,
                        caption: action.data.caption,
                    })
                    .then(() => true)
        }
    }

    async forwardPrivateMessagesToTopic(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'forwardPrivateMessagesToTopic'>
    ): Promise<boolean> {
        switch (action.dialogType) {
            case 'topicDefault': {
                if (!user.telegramTopic) {
                    throw Error(
                        `There is no user topic ${UserProfile.Formatter.getTgUserString(user.telegramInfo, { addUserId: true })}`
                    )
                }
                const result = await this.bot.telegram
                    .forwardMessages(
                        user.telegramTopic.chatId,
                        action.forwardFromChatId,
                        action.forwardMessageIds,
                        { message_thread_id: user.telegramTopic.messageThreadId }
                    )
                    .tryResult()
                if (result.success) return true

                const parsedError = getSendMessageErrorType(result.error)
                if (parsedError.type === 'messageToForwardNotFound') {
                    return this.bot.telegram
                        .sendMessage(
                            user.telegramTopic.chatId,
                            `Не удалось переслать сообщения ${JSON.stringify(action.forwardMessageIds)}\nОшибка: ${result.error}`,
                            { message_thread_id: user.telegramTopic.messageThreadId }
                        )
                        .then(() => true)
                }
                throw result.error
            }
        }
    }

    async sendTopicChangeLogs(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'sendTopicChangeLogs'>
    ): Promise<boolean> {
        const newTopicInfo = user.telegramTopic
        if (!newTopicInfo) throw Error(`Topic must exist before send logs: ${user.telegramId}`)

        // Notification to the new topic
        const topicHistoryString = UserProfile.Formatter.createNewTopicCreationNotificationString(
            user,
            newTopicInfo
        )

        const lastTopic = user.telegramTopicHistory.last
        if (lastTopic) {
            await this.serviceBot.telegram
                .closeForumTopic(lastTopic.chatId, lastTopic.messageThreadId)
                .catch((error) => {
                    if (
                        error instanceof Error &&
                        error.message.includes('TOPIC_NOT_MODIFIED').isFalse
                    ) {
                        logger.error(error)
                    }
                })
        }

        // Notification to the old topics
        await Promise.all([
            ...user.telegramTopicHistory.map((oldTopicInfo) =>
                this.serviceBot.telegram.sendMessage(oldTopicInfo.chatId, topicHistoryString, {
                    message_thread_id: oldTopicInfo.messageThreadId,
                })
            ),
        ])

        return this.serviceBot.telegram
            .sendMessage(newTopicInfo.chatId, topicHistoryString, {
                message_thread_id: newTopicInfo?.messageThreadId,
            })
            .then((message) =>
                this.serviceBot.telegram.pinChatMessage(message.chat.id, message.message_id)
            )
    }

    async resendMainMenuIfNeeded(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'resendMainMenuIfNeeded'>
    ): Promise<boolean> {
        const scenesToNotSendMainMenu: SceneName.Union[] = []
        if (scenesToNotSendMainMenu.includes(user.sceneData?.sceneName ?? 'mainMenu') === false) {
            await this.privateDialogDispatcher.enterNewScene({
                userTelegramId: user.telegramId,
                sceneEntranceDto: { sceneName: 'mainMenu' },
            })
        }

        return true
    }

    private getDdi(user: UserProfile.BaseType) {
        return this.telegramBridgeFactoryService.generateDdi({
            userTelegramId: user.telegramId,
        })
    }

    private async createUserTopic(
        user: UserProfile.BaseType,
        topicType: UserProfile.TelegramTopic.TopicType
    ): Promise<UserProfile.TelegramTopic.BaseType | null> {
        const topicTitle = UserProfile.Formatter.getTgUserString(user.telegramInfo, {
            addUserId: true,
        })

        const forumIdsByTopicType: Record<UserProfile.TelegramTopic.TopicType, number> = {
            default: internalConstants.chatIds.moderationForums.default,
        }
        const forumId = forumIdsByTopicType[topicType]

        const topicInfo = await this.serviceBot.telegram.createForumTopic(forumId, topicTitle)

        const newTelegramTopic: UserProfile.TelegramTopic.BaseType = {
            type: topicType,
            topicId: UserProfile.TelegramTopic.activeIdByType[topicType],
            chatId: forumId,
            messageThreadId: topicInfo.message_thread_id,
            creationDate: Date.new(),
        }

        return newTelegramTopic
    }

    private extractSendMessageActionTelegramCallOptions(
        user: UserProfile.BaseType,
        action: ChainTask.Actions.ActionsWithActionType<'sendMessage'>
    ): {
        sender: Pick<ApiClient, 'callApi'>
        targetArgs: { chat_id: number; message_thread_id?: number | undefined }
    } {
        switch (action.dialogType) {
            case 'privateDialog':
                return {
                    sender: this.getDdi(user),
                    targetArgs: {
                        chat_id: user.telegramId,
                    },
                }

            case 'topicDefault':
                if (!user.telegramTopic) {
                    throw Error(
                        `There is no user topic ${UserProfile.Formatter.getTgUserString(user.telegramInfo, { addUserId: true })}`
                    )
                }
                return {
                    sender: this.serviceBot.telegram,
                    targetArgs: {
                        chat_id: user.telegramTopic.chatId,
                        message_thread_id: user.telegramTopic.messageThreadId,
                    },
                }
        }

        throw Error(`Send message action dialog type ${action.dialogType} is not supported`)
    }
}

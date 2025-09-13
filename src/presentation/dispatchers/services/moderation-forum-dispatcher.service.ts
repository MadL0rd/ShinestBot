import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { TelegramBridgeFactoryService } from 'src/business-logic/telegram-bridge/telegram-bridge-factory/telegram-bridge-factory.service'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { UserProfile } from 'src/entities/user-profile'
import { getSendMessageErrorType } from 'src/presentation/utils/get-send-message-error-type.utils'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Telegraf } from 'telegraf'
import { CallbackQuery } from 'telegraf/types'

@Injectable()
export class ModerationForumDispatcherService {
    constructor(
        @InjectBot('Bot') private readonly serviceBot: Telegraf,
        private readonly userService: UserService,
        private readonly botContentService: BotContentService,
        private readonly chainTasksService: ChainTasksService,
        private readonly telegramBridgeFactory: TelegramBridgeFactoryService
    ) {}

    async handleAdminMessageInTopic(args: {
        ctx: ExtendedMessageContext
        adminProfile: UserProfileDocument
        userProfile: UserProfileDocument
    }): Promise<void> {
        const { ctx, adminProfile, userProfile: user } = args

        const access = UserProfile.Helper.getUserAccessRules(adminProfile.permissions)
        if (!access.canWriteInModerationForum) {
            const tgUserInfo = JSON.stringify(ctx.from, null, 2)
            logger.error(`This user have no access to write in moderation forum\n${tgUserInfo}`)
            return
        }

        if (!ctx.message.message_thread_id) return
        if (!user.telegramTopic) return

        const content = await this.botContentService.getContent(
            internalConstants.sheetContent.defaultLanguage
        )
        const message = ctx.message

        if (message.type === 'text') {
            switch (message.text) {
                case content.uniqueMessage.adminForum.pinTopicHistoryMessage: {
                    const topicInfoString =
                        UserProfile.Formatter.createNewTopicCreationNotificationString(
                            user,
                            user.telegramTopic
                        )
                    const sendedMessage = await ctx.replyWithHTML(topicInfoString)
                    await ctx.pinChatMessage(sendedMessage.message_id).tryResult()
                    return
                }

                default:
                    break
            }
        }

        try {
            await this.replyAdminMessageToUser(ctx, adminProfile, user)

            this.userService.logToUserHistory(adminProfile, {
                type: 'managerSendMessageToUser',
                targetUserTelegramId: user.telegramId,
                messageType: message.type,
                text: message.type === 'text' ? message.text : undefined,
            })
            this.userService.logToUserHistory(user, {
                type: 'userWasManagerMessageTarget',
                actorTelegramId: adminProfile.telegramId,
                messageType: message.type,
                text: message.type === 'text' ? message.text : undefined,
            })
        } catch (error) {
            const botWasBlockedByUser =
                getSendMessageErrorType(error).type === 'botWasBlockedByUser'

            await this.serviceBot.telegram.setMessageReaction(ctx.chat.id, message.message_id, [
                {
                    type: 'emoji',
                    emoji: botWasBlockedByUser ? '🤬' : '🌚',
                },
            ])

            if (!botWasBlockedByUser) throw error
        }
    }

    async sendCallbackDataToForum(user: UserProfile.BaseType, callbackQuery: CallbackQuery) {
        let callbackString = JSON.stringify(callbackQuery)
        if ('data' in callbackQuery && callbackQuery.data) {
            callbackString = callbackQuery.data
            if (
                callbackQuery.message &&
                'reply_markup' in callbackQuery.message &&
                callbackQuery.message.reply_markup
            ) {
                const currentBtn = callbackQuery.message.reply_markup.inline_keyboard
                    .flat()
                    .find(
                        (button) =>
                            'callback_data' in button && button.callback_data === callbackString
                    )
                callbackString = currentBtn ? JSON.stringify(currentBtn) : callbackString
            }
        }

        await this.chainTasksService.addTask({
            userTelegramId: user.telegramId,
            action: {
                resourceType: 'telegram',
                actionType: 'sendMessage',
                dialogType: 'topicDefault',
                data: {
                    type: 'text',
                    text: `Нажал на кнопку:\n${callbackString}`,
                },
            },
        })
    }

    private async replyAdminMessageToUser(
        ctx: ExtendedMessageContext,
        adminProfile: UserProfile.BaseType,
        userProfile: UserProfile.BaseType
    ): Promise<void> {
        if (!ctx.message || !ctx.chat) return
        const userTelegramId = userProfile.telegramId

        const text = await this.botContentService
            .getContent()
            .then((content) => content.uniqueMessage)
        const lastContactInfo = userProfile.lastContactWithModerator
        const ddi = this.telegramBridgeFactory.generateDdi({
            userTelegramId,
            actorTelegramId: adminProfile.telegramId,
        })
        ddi.shouldForwardMessagesToTopic = false

        let timeout = Number(text.adminForum.messageFromAdminTimeout)
        timeout = Number.isNaN(timeout) ? 15 : timeout
        if (
            !lastContactInfo ||
            (lastContactInfo &&
                lastContactInfo.datetime &&
                lastContactInfo.moderatorId &&
                (lastContactInfo.datetime.isTimeoutReached(timeout, 'minutes') ||
                    lastContactInfo.moderatorId != adminProfile.telegramId))
        ) {
            await ddi.sendHtml(
                text.adminForum.messageFromAdmin({
                    adminName: adminProfile.telegramInfo.first_name,
                })
            )
            userProfile.lastContactWithModerator = {
                moderatorId: adminProfile.telegramId,
                datetime: new Date(),
            }
            await this.userService.update(userProfile, ['lastContactWithModerator'])
        }

        await ddi.copyMessages({
            from_chat_id: ctx.chat.id,
            message_ids: ctx.mediaGroup
                ? ctx.mediaGroup.messages.map((message) => message.message_id)
                : [ctx.message.message_id],
        })
    }
}

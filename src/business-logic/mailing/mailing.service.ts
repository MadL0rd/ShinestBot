import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { UserProfile } from 'src/entities/user-profile'
import { ExceptionGuard } from 'src/exceptions-and-logging/exception-guard.decorator'
import { getSendMessageErrorType } from 'src/presentation/utils/get-send-message-error-type.utils'
import { generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import { pickFields } from 'src/utils/pick-fields'
import { sleep } from 'src/utils/sleep'
import { Context, Telegraf } from 'telegraf'
import { InlineKeyboardButton } from 'telegraf/types'
import { BotContentService } from '../bot-content/bot-content.service'
import { ChainTasksService } from '../chain-tasks/chain-tasks.service'
import { TelegramBridgeFactoryService } from '../telegram-bridge/telegram-bridge-factory/telegram-bridge-factory.service'
import { UserProfileDocument } from '../user/schemas/user.schema'
import { UserService } from '../user/user.service'
import { MailingRepository } from './mailing.repo'
import { MailingMessage } from './schemas/mailing-message.entity'
import {
    MailingCreatorMetadata,
    MailingDocument,
    MailingProgressRecord,
    MailingProgressStatisticCategory,
} from './schemas/mailings.schema'

@Injectable()
export class MailingService implements OnModuleInit {
    private processingMailingIds: Set<string>

    constructor(
        @InjectBot('Bot') private readonly bot: Telegraf<Context>,
        private readonly userService: UserService,
        private readonly botContent: BotContentService,
        private readonly chainTasksService: ChainTasksService,
        private readonly mailingRepo: MailingRepository,
        private readonly ddiFactory: TelegramBridgeFactoryService
    ) {
        this.processingMailingIds = new Set()
    }

    async onModuleInit() {
        const activeMailings = await this.mailingRepo.findAllActive()
        for (const mailing of activeMailings) {
            this.processMailing(mailing)
        }
    }

    // =====================
    // Mailing actions
    // =====================

    async pauseMailing(mailingId: string) {
        const mailing = await this.mailingRepo.findOneById(mailingId)
        if (!mailing) {
            logger.error(`There is no mailing with id ${mailingId}`)
            return
        }

        const allowedStates: MailingDocument['state'][] = ['pending', 'inProgress']
        if (
            this.processingMailingIds.has(mailingId) === false ||
            allowedStates.includes(mailing.state) === false
        ) {
            await this.updateMailingStatusMessage(mailing).catch(() => {})
            logger.error(
                `Mailing with id ${mailingId} can not be paused. Pause is allowed only for ${JSON.stringify(allowedStates)}`
            )
            return
        }

        this.processingMailingIds.delete(mailingId)

        mailing.state = 'paused'
        await this.mailingRepo.update(mailing, ['state'])

        await Promise.retry({
            call: () => this.updateMailingStatusMessage(mailing),
            count: 30,
            timeoutSec: 10,
            onError: async (error) => {
                const parsedError = getSendMessageErrorType(error)
                if (parsedError.type === 'tooManyRequests') {
                    await sleep(parsedError.timeoutSec)
                } else {
                    logger.error('Fail to send storage chat message', error)
                }
            },
        }).catch((e) => {
            logger.error(`Fail to update mailing status message`, e)
        })
    }

    async continueMailing(mailingId: string) {
        const mailing = await this.mailingRepo.findOneById(mailingId)

        if (!mailing) {
            logger.error(`There is no mailing with id ${mailingId}`)
            return
        }
        if (this.processingMailingIds.has(mailingId) || mailing.state !== 'paused') {
            await this.updateMailingStatusMessage(mailing).catch(() => {})
            logger.error(
                `Mailing with id ${mailingId} can not be deleted. Deleting is allowed only for paused mailings`
            )
            return
        }

        mailing.state = mailing.mailingStatusMessage ? 'inProgress' : 'pending'
        await this.mailingRepo.update(mailing, ['state'])

        await Promise.retry({
            call: () => this.updateMailingStatusMessage(mailing),
            count: 30,
            timeoutSec: 10,
            onError: async (error) => {
                const parsedError = getSendMessageErrorType(error)
                if (parsedError.type === 'tooManyRequests') {
                    await sleep(parsedError.timeoutSec)
                } else {
                    logger.error('Fail to send storage chat message', error)
                }
            },
        }).catch((e) => {
            logger.error(`Fail to update mailing status message`, e)
        })

        this.processMailing(mailing)
    }

    async removeMailingMessages(mailingId: string) {
        const mailing = await this.mailingRepo.findOneById(mailingId)
        if (!mailing) {
            logger.error(`There is no mailing with id ${mailingId}`)
            return
        }
        if (this.processingMailingIds.has(mailingId) || mailing.state !== 'paused') {
            await this.updateMailingStatusMessage(mailing).catch(() => {})
            logger.error(
                `Mailing with id ${mailingId} can not be deleted. Deleting is allowed only for paused mailings`
            )
            return
        }

        mailing.state = 'deleting'
        await this.mailingRepo.update(mailing, ['state'])

        await Promise.retry({
            call: () => this.updateMailingStatusMessage(mailing),
            count: 30,
            timeoutSec: 10,
            onError: async (error) => {
                const parsedError = getSendMessageErrorType(error)
                if (parsedError.type === 'tooManyRequests') {
                    await sleep(parsedError.timeoutSec)
                } else {
                    logger.error('Fail to send storage chat message', error)
                }
            },
        }).catch((e) => {
            logger.error(`Fail to update mailing status message`, e)
        })

        this.processMailing(mailing)
    }

    async startMailing(args: {
        mailingMessage: MailingMessage.BaseType
        telegramIds: number[]
        metadata: MailingCreatorMetadata
    }) {
        const { mailingMessage, telegramIds, metadata } = args

        const mailing = await this.mailingRepo.create({
            state: 'pending',
            targetUserTelegramIds: telegramIds,
            creationMetadata: {
                ...metadata,
                originalTargetUsers: {
                    telegramIds: telegramIds,
                },
            },
            mailingMessage: mailingMessage,
        })

        this.processMailing(mailing)
    }

    async sendMailingMessageToUser(args: {
        mailingMessage: MailingMessage.BaseType
        user: UserProfile.BaseType
    }) {
        const { mailingMessage, user } = args
        const ddi = this.ddiFactory.generateDdi({ userTelegramId: user.telegramId })
        ddi.shouldForwardMessagesToTopic = false

        switch (mailingMessage.content.type) {
            case 'copyContent': {
                if (!mailingMessage.author) {
                    throw Error(
                        `Mailing message with content type '${mailingMessage.content.type}' must contain author`
                    )
                }
                return await ddi.copyMessage({
                    from_chat_id: mailingMessage.author.id,
                    message_id: mailingMessage.content.messageId,
                })
                break
            }

            case 'forwardedMessage': {
                if (!mailingMessage.author) {
                    throw Error(
                        `Mailing message with content type '${mailingMessage.content.type}' must contain author`
                    )
                }
                return ddi.forwardMessage({
                    from_chat_id: mailingMessage.author.id,
                    message_id: mailingMessage.content.messageId,
                })
                break
            }

            case 'custom': {
                const messageText = mailingMessage.content.text?.replaceAll(
                    MailingMessage.telegramIdMask,
                    user.telegramId.toString()
                )

                if (mailingMessage.content.photo) {
                    return ddi.sendPhoto({
                        photo: mailingMessage.content.photo,
                        caption: messageText,
                        parse_mode: 'HTML',
                        reply_markup: { inline_keyboard: mailingMessage.content.inlineButtons },
                    })
                }

                if (!messageText) throw Error(`Message content must have text or photo`)

                return ddi.sendHtml(messageText, {
                    reply_markup: { inline_keyboard: mailingMessage.content.inlineButtons },
                })
            }
        }
    }

    // =====================
    // Private methods
    // =====================

    @ExceptionGuard()
    private async processMailing(mailing: MailingDocument) {
        if (this.processingMailingIds.has(mailing.id)) return
        this.processingMailingIds.add(mailing.id)

        const infiniteLoopHealthCheck = {
            prevState: mailing.state,
            iterationsSameStateCount: 0,
            totalIterationsCount: 0,
        }
        while (
            mailing.state !== 'completed' &&
            mailing.state !== 'paused' &&
            mailing.issued !== true &&
            this.processingMailingIds.has(mailing.id)
        ) {
            logger.log(`Processing mailing state: ${JSON.stringify(mailing)}`)

            infiniteLoopHealthCheck.totalIterationsCount += 1
            if (infiniteLoopHealthCheck.totalIterationsCount > 10) {
                logger.error(
                    `Mailing:${mailing.id}\nInfinite loop detected. Force context interruption!`
                )
                mailing.issued = true
                await this.mailingRepo.update(mailing, ['issued'])
                break
            }

            if (infiniteLoopHealthCheck.prevState === mailing.state) {
                infiniteLoopHealthCheck.iterationsSameStateCount += 1
            } else {
                infiniteLoopHealthCheck.prevState = mailing.state
                infiniteLoopHealthCheck.iterationsSameStateCount = 0
            }
            if (infiniteLoopHealthCheck.iterationsSameStateCount > 5) {
                logger.error(
                    `Mailing:${mailing.id}\nInfinite loop detected. Force context interruption!`
                )
                mailing.issued = true
                await this.mailingRepo.update(mailing, ['issued'])
                break
            }

            switch (mailing.state) {
                case 'pending':
                    mailing.mailingStatusMessage = await this.sendMailingStatusMessage(mailing)
                    if (!mailing.mailingStatusMessage) {
                        mailing.issued = true
                        await this.mailingRepo.update(mailing, ['issued'])
                        return
                    }

                    mailing.state = 'inProgress'
                    await this.mailingRepo.update(mailing, ['mailingStatusMessage', 'state'])
                    break

                case 'inProgress': {
                    const result = await this.sendMailingMessagesToUsers(mailing)
                    switch (result.result) {
                        case 'completed':
                            mailing.state = 'resultInfoUpdating'
                            await this.mailingRepo.update(mailing, ['state'])
                            break
                        case 'interrupted':
                            this.processingMailingIds.delete(mailing.id)
                            return
                    }
                    break
                }

                case 'deleting':
                    await this.removeSendedMailingMessages(mailing)
                    mailing.state = 'resultInfoUpdating'
                    await this.mailingRepo.update(mailing, ['state'])
                    break

                case 'resultInfoUpdating': {
                    const updateResult = await Promise.retry({
                        call: () => this.updateMailingStatusMessage(mailing),
                        count: 30,
                        timeoutSec: 10,
                        onError: async (error) => {
                            const parsedError = getSendMessageErrorType(error)
                            if (parsedError.type === 'tooManyRequests') {
                                await sleep(parsedError.timeoutSec)
                            } else {
                                logger.error('Fail to send storage chat message', error)
                            }
                        },
                    }).catch((e) => {
                        logger.error(`Fail to update mailing status message`, e)
                    })

                    if (updateResult?.success !== true) break

                    mailing.state = 'completed'
                    await this.mailingRepo.update(mailing, ['state'])
                    break
                }
            }
        }

        this.processingMailingIds.delete(mailing.id)
    }

    private async sendMailingStatusMessage(
        mailing: MailingDocument
    ): Promise<MailingDocument['mailingStatusMessage'] | null> {
        const storageChatMsg = await Promise.retry({
            call: () =>
                this.bot.telegram.sendMessage(
                    internalConstants.chatIds.fileStorageChatId,
                    this.generateMailingInfoMessageText(mailing),
                    {
                        reply_markup: {
                            inline_keyboard: this.generateMailingInfoMessageButtons(mailing),
                        },
                    }
                ),
            count: 30,
            timeoutSec: 1,
            onError: async (error) => {
                const parsedError = getSendMessageErrorType(error)
                if (parsedError.type === 'tooManyRequests') {
                    await sleep(parsedError.timeoutSec)
                } else {
                    logger.error('Fail to send storage chat message', error)
                }
            },
        }).catch((e) => {
            logger.error(`Fail to send mailing status message`, e)
        })
        if (!storageChatMsg) return null

        return {
            chatId: storageChatMsg.chat.id,
            messageId: storageChatMsg.message_id,
        }
    }

    private async updateMailingStatusMessage(mailing: MailingDocument) {
        if (!mailing.mailingStatusMessage) return
        if (!mailing.mailingProgress) return

        return await this.bot.telegram
            .editMessageText(
                internalConstants.chatIds.fileStorageChatId,
                mailing.mailingStatusMessage.messageId,
                undefined,
                this.generateMailingInfoMessageText(mailing),
                {
                    reply_markup: {
                        inline_keyboard: this.generateMailingInfoMessageButtons(mailing),
                    },
                }
            )
            .then((message) => {
                return {
                    success: true as const,
                }
            })
            .catch((error) => {
                const parsedError = getSendMessageErrorType(error)
                if (parsedError.type === 'messageIsNotModified') {
                    return {
                        success: true as const,
                    }
                }
                throw error
            })
    }

    private generateMailingInfoMessageText(mailing: MailingDocument): string {
        const status = (() => {
            switch (mailing.state) {
                case 'pending':
                case 'inProgress':
                    return `▶️ Идет отправка`

                case 'paused':
                    return `⏸️ Пауза`

                case 'deleting':
                    return `🚮 Удаление`

                case 'resultInfoUpdating':
                case 'completed':
                    return `🎉 Обработка завершена`
            }
        })()

        const delayInfo =
            (mailing.mailingMessage.delaySecPerSending ?? 0) > 0
                ? `Задержка при отправке: ${mailing.mailingMessage.delaySecPerSending} сек.`
                : null

        const progress = mailing.mailingProgress
        const progressInfo = progress
            ? [
                  `Прогресс: ${progress.records.length}/${mailing.targetUserTelegramIds.length}`,
                  `Успешно: ${progress.statisticSending.success}`,
                  `Заблокировали бота: ${progress.statisticSending.blockedUsers}`,
                  `Удаленные пользователи: ${progress.statisticSending.deactivatedUsers}`,
                  `Ошибка отправки: ${progress.statisticSending.sendMessageError}`,
                  `Неизвестные ошибки: ${progress.statisticSending.unknownErrors}`,
              ].join('\n')
            : null

        const progressRemoving = progress?.statisticRemoving
        const progressRemovingInfo = progressRemoving
            ? [
                  `Удалено: ${progressRemoving.success}`,
                  `Не удалось удалить: ${progressRemoving.removeMessageError}`,
              ].join('\n')
            : null

        const createdBy = (() => {
            switch (mailing.creationMetadata.createdBy) {
                case 'api':
                    return `API`
                case 'admin':
                    return [
                        UserProfile.Formatter.getTgUserString(
                            mailing.creationMetadata.adminTelegramUserInfo
                        ),
                        `Выборка: ${mailing.creationMetadata.usersSelectionCriteria}`,
                    ].join('\n')
            }
        })()

        const shrinkMessageText = (text: string) =>
            text.length > 64 ? `${text.slice(0, 64)}...` : text

        const messageContent = (() => {
            const idsPrefix = [
                `Mailing id: ${mailing.id}`,
                mailing.mailingMessage.shortId
                    ? `Mailing message short id: ${mailing.mailingMessage.shortId}`
                    : undefined,
            ].compact.join('\n')

            switch (mailing.mailingMessage.content.type) {
                case 'custom': {
                    const contentInfo = [
                        mailing.mailingMessage.content.photo ? 'Фото' : null,
                        mailing.mailingMessage.content.text
                            ? shrinkMessageText(mailing.mailingMessage.content.text)
                            : null,
                    ].compact.join(' + ')
                    return [idsPrefix, `Контент: ${contentInfo}`].join('\n')
                }

                case 'copyContent':
                case 'forwardedMessage': {
                    const contentSendType = `Тип отправки: ${mailing.mailingMessage.content.type}`
                    if (!mailing.mailingMessage.content.originalMessage) return contentSendType

                    let messageContent = ''
                    if (mailing.mailingMessage.content.originalMessage.type === 'text') {
                        messageContent = shrinkMessageText(
                            mailing.mailingMessage.content.originalMessage.text
                        )
                    } else {
                        if (
                            'caption' in mailing.mailingMessage.content.originalMessage &&
                            mailing.mailingMessage.content.originalMessage.caption?.isNotEmpty
                        ) {
                            messageContent = `${mailing.mailingMessage.content.originalMessage.type} + ${shrinkMessageText(mailing.mailingMessage.content.originalMessage.caption)}`
                        } else {
                            messageContent = mailing.mailingMessage.content.originalMessage.type
                        }
                    }

                    return [contentSendType, idsPrefix, `Контент: ${messageContent}`].join('\n')
                }
            }
        })()

        const messageText = [
            status,
            delayInfo,
            progressInfo,
            progressRemovingInfo,
            `Инициатор: ${createdBy}`,
            messageContent,
        ].compact.join('\n\n')

        return messageText
    }

    private generateMailingInfoMessageButtons(mailing: MailingDocument): InlineKeyboardButton[][] {
        switch (mailing.state) {
            case 'pending':
            case 'inProgress':
                return [
                    [
                        generateInlineButton(
                            {
                                text: '⏸️ Пауза',
                                action: {
                                    actionType: 'storageChatActionMailingPause',
                                    data: {
                                        mId: mailing.id,
                                    },
                                },
                            },
                            'mainMenu'
                        ),
                    ],
                ]

            case 'paused':
                return [
                    [
                        generateInlineButton(
                            {
                                text: '▶️ Продолжить',
                                action: {
                                    actionType: 'storageChatActionMailingContinue',
                                    data: {
                                        mId: mailing.id,
                                    },
                                },
                            },
                            'mainMenu'
                        ),
                        generateInlineButton(
                            {
                                text: '🫣 Удалить сообщения',
                                action: {
                                    actionType: 'storageChatActionMailingRemoveMessages',
                                    data: {
                                        mId: mailing.id,
                                    },
                                },
                            },
                            'mainMenu'
                        ),
                    ],
                ]

            case 'resultInfoUpdating':
            case 'completed':
            case 'deleting':
                return []
        }
    }

    private async sendMailingMessagesToUsers(
        mailing: MailingDocument
    ): Promise<{ result: 'completed' | 'interrupted'; mailing: MailingDocument }> {
        const { targetUserTelegramIds: telegramIds, mailingMessage } = mailing
        logger.log(`Start mailing: ${JSON.stringify(mailing)}`)

        if (!mailing.mailingProgress) {
            mailing.mailingProgress = {
                statisticSending: {
                    success: 0,
                    blockedUsers: 0,
                    deactivatedUsers: 0,
                    unknownErrors: 0,
                    sendMessageError: 0,
                },
                statisticRemoving: null,
                records: [],
            }
            await this.mailingRepo.update(mailing, ['mailingProgress'])
        }

        const processedUserIds = new Set(
            mailing.mailingProgress.records.map((record) => record.chatId)
        )

        for (const [index, userTelegramId] of telegramIds.entries()) {
            if (processedUserIds.has(userTelegramId)) continue

            const userValidationResult =
                await this.validateIsMailingAvailableForUser(userTelegramId)

            if (mailingMessage.delaySecPerSending) {
                await sleep(mailingMessage.delaySecPerSending)
            }

            // Processing can be stopped from outer context
            if (this.processingMailingIds.has(mailing.id).isFalse) {
                return { result: 'interrupted', mailing: mailing }
            }

            const result =
                userValidationResult.isAvailable === true
                    ? await this.processMailingMessageSendingToUser({
                          mailing: mailing,
                          user: userValidationResult.user,
                      })
                    : pickFields(userValidationResult, ['category', 'result'])

            mailing.mailingProgress.statisticSending[result.category] += 1
            mailing.mailingProgress.records.push(result.result)
            await this.mailingRepo.update(mailing, ['mailingProgress'])

            if (index % 10 === 0) await this.updateMailingStatusMessage(mailing).catch(() => {})
        }

        return { result: 'completed', mailing: mailing }
    }

    private async removeSendedMailingMessages(mailing: MailingDocument): Promise<MailingDocument> {
        logger.log(`Start removing sended mailing messages: ${JSON.stringify(mailing)}`)

        if (!mailing.mailingProgress) return mailing
        if (!mailing.mailingProgress.statisticRemoving) {
            mailing.mailingProgress.statisticRemoving = {
                success: 0,
                removeMessageError: 0,
            }
            await this.mailingRepo.update(mailing, ['mailingProgress'])
        }

        for (let index = 0; index < mailing.mailingProgress.records.length; index++) {
            const record = mailing.mailingProgress.records[index]
            if (record.status !== 'sended') continue

            const result = await Promise.retry({
                call: () => this.bot.telegram.deleteMessages(record.chatId, record.messageIds),
                count: 8,
                timeoutSec: 1,
                onError: async (error) => {
                    const parsedError = getSendMessageErrorType(error)
                    switch (parsedError.type) {
                        case 'botWasBlockedByUser':
                        case 'userIsDeactivated':
                            throw error

                        case 'tooManyRequests':
                            await sleep(parsedError.timeoutSec)
                            break

                        case 'messageThreadNotFound':
                        case 'messageToForwardNotFound':
                        case 'messageIsNotModified':
                        case undefined:
                            break
                    }
                },
            })
                .then((message) => {
                    return { success: true as const }
                })
                .catch(async (error) => {
                    const parsedError = getSendMessageErrorType(error)

                    return {
                        success: false as const,
                        error: parsedError.type ?? null,
                    }
                })

            if (result.success === true) {
                mailing.mailingProgress.statisticRemoving.success += 1
                record.status = 'deleted'
                await this.mailingRepo.update(mailing, ['mailingProgress'])
            } else {
                mailing.mailingProgress.statisticRemoving.success += 1
                record.status = 'deleted'
                await this.mailingRepo.update(mailing, ['mailingProgress'])
            }

            if (index % 10 === 0) await this.updateMailingStatusMessage(mailing).catch(() => {})
        }

        return mailing
    }

    private async validateIsMailingAvailableForUser(userTelegramId: number): Promise<
        | { isAvailable: true; user: UserProfileDocument }
        | {
              isAvailable: false
              category: MailingProgressStatisticCategory
              result: MailingProgressRecord
          }
    > {
        const user = await this.userService.findOneByTelegramId(userTelegramId)

        if (!user) {
            const errorText = `Cannot find user with id${userTelegramId}`
            logger.error(errorText)
            return {
                isAvailable: false,
                category: 'unknownErrors',
                result: {
                    chatId: userTelegramId,
                    status: 'failed',
                    error: errorText,
                },
            }
        }
        if (user.telegramInfo.is_bot) {
            return {
                isAvailable: false,
                category: 'unknownErrors',
                result: {
                    chatId: userTelegramId,
                    status: 'skipped',
                    reason: 'user is bot',
                },
            }
        }
        if (user.isBotBlocked) {
            return {
                isAvailable: false,
                category: 'blockedUsers',
                result: {
                    chatId: userTelegramId,
                    status: 'skipped',
                    reason: 'user blocked the bot',
                },
            }
        }
        if (user.telegramUserIsDeactivated) {
            return {
                isAvailable: false,
                category: 'deactivatedUsers',
                result: {
                    chatId: userTelegramId,
                    status: 'skipped',
                    reason: 'telegram user is deactivated',
                },
            }
        }

        return {
            isAvailable: true,
            user: user,
        }
    }

    private async processMailingMessageSendingToUser(args: {
        mailing: MailingDocument
        user: UserProfileDocument
    }): Promise<{ category: MailingProgressStatisticCategory; result: MailingProgressRecord }> {
        const { mailing, user } = args
        const mailingMessage = mailing.mailingMessage

        const sendMessageResult = await Promise.retry({
            call: () =>
                this.sendMailingMessageToUser({
                    mailingMessage: mailingMessage,
                    user: user,
                }),
            count: 8,
            timeoutSec: 1,
            onError: async (error) => {
                const parsedError = getSendMessageErrorType(error)
                switch (parsedError.type) {
                    case 'botWasBlockedByUser':
                    case 'userIsDeactivated':
                        throw error

                    case 'tooManyRequests':
                        await sleep(parsedError.timeoutSec)
                        break

                    case 'messageThreadNotFound':
                    case 'messageToForwardNotFound':
                    case 'messageIsNotModified':
                    case undefined:
                        break
                }
            },
        })
            .then((message) => {
                return { success: true as const, messageId: message.message_id }
            })
            .catch(async (error) => ({
                success: false as const,
                error: getSendMessageErrorType(error),
            }))

        if (sendMessageResult.success) {
            return {
                category: 'success',
                result: {
                    chatId: user.telegramId,
                    status: 'sended',
                    messageIds: [sendMessageResult.messageId],
                },
            }
        }

        let category: MailingProgressStatisticCategory = 'unknownErrors'
        switch (sendMessageResult.error.type) {
            case 'botWasBlockedByUser':
                category = 'blockedUsers'
                await this.userService.update({
                    telegramId: user.telegramId,
                    isBotBlocked: true,
                })
                await this.userService.logToUserHistory(user, {
                    type: 'botBlocked',
                })
                break

            case 'userIsDeactivated':
                category = 'deactivatedUsers'
                await this.userService.update({
                    telegramId: user.telegramId,
                    telegramUserIsDeactivated: true,
                })
                await this.userService.logToUserHistory(user, {
                    type: 'userIsDeactivated',
                })
                break

            case 'tooManyRequests':
                category = 'sendMessageError'
                logger.error('Still to many requests 😳')
                break

            case 'messageThreadNotFound':
            case 'messageToForwardNotFound':
            case 'messageIsNotModified':
                category = 'sendMessageError'
                logger.error('Fail to send mailing message', sendMessageResult.error.error)
                break

            case null:
            case undefined:
                category = 'sendMessageError'
                logger.error('Fail to send mailing message', sendMessageResult.error)
                break
        }

        return {
            category: category,
            result: {
                chatId: user.telegramId,
                status: 'failed',
                error: sendMessageResult.error.type ?? null,
            },
        }
    }
}

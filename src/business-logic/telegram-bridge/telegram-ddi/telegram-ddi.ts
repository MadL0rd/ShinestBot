import { logger } from 'src/app/app.logger'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserService } from 'src/business-logic/user/user.service'
import { MediaContentWithSendOptions } from 'src/entities/common/media-content.entity'
import { OmitFields } from 'src/entities/common/utility-types-extensions'
import { pickFields } from 'src/utils/pick-fields'
import { Telegraf, TelegramError } from 'telegraf'
import { MessageId, Opts, ReplyKeyboardMarkup, ReplyKeyboardRemove, Telegram } from 'telegraf/types'
import { sendMediaContentViaTelegram } from '../utils/send-media-content-via-telegram'
import { TelegramDirectDialogInteractorAbstract } from './telegram-ddi-abstract'
import { TelegramDdiMethodArgs, TelegramMethodArgs, TgCallAsyncResult } from './telegram-ddi-types'

export class TelegramDirectDialogInteractor extends TelegramDirectDialogInteractorAbstract {
    readonly bot: Telegraf
    private readonly userService: UserService
    private readonly chainTasksService: ChainTasksService
    private readonly actorTelegramId: number | undefined

    shouldForwardMessagesToTopic: boolean

    constructor(args: {
        bot: Telegraf
        userTelegramId: number
        userService: UserService
        chainTasksService: ChainTasksService
        actorTelegramId?: number
    }) {
        super(args.userTelegramId)
        this.shouldForwardMessagesToTopic = true
        Object.assign(
            this,
            pickFields(args, ['bot', 'userService', 'chainTasksService', 'actorTelegramId'])
        )
    }

    private containsKeyboard<ArgsType extends object>(
        args: ArgsType
    ): args is ArgsType & { reply_markup: ReplyKeyboardMarkup } {
        return (args as any)?.reply_markup?.keyboard?.isNotEmpty === true
    }

    private containsKeyboardRemove<ArgsType extends object>(
        args: ArgsType
    ): args is ArgsType & { reply_markup: ReplyKeyboardRemove } {
        return (args as any)?.reply_markup?.remove_keyboard === true
    }

    override async callApi<Method extends keyof Telegram>(
        method: Method,
        args: Opts<Method>
    ): TgCallAsyncResult<Method> {
        const argsContainsKeyboard = this.containsKeyboard(args)
        if (argsContainsKeyboard) {
            args.reply_markup.is_persistent = true
        }
        const result = await this.bot.telegram.callApi(method, args).tryResult()

        if (result.success && typeof result.result === 'object' && 'message_id' in result.result) {
            if (argsContainsKeyboard) {
                await this.userService.update({
                    telegramId: this.userTelegramId,
                    currentKeyboard: {
                        exists: true,
                        messageId: result.result.message_id,
                        replyMarkup: args.reply_markup,
                    },
                })
            }
            if (this.containsKeyboardRemove(args)) {
                await this.userService.update({
                    telegramId: this.userTelegramId,
                    currentKeyboard: { exists: false },
                })
            }
        }

        /**
         * User events log should not contain real files content
         */
        if (
            method === 'sendDocument' &&
            'document' in args &&
            typeof args.document === 'object' &&
            'source' in args.document &&
            typeof args.document.source !== 'string'
        ) {
            args.document.source = 'BINARY_DATA_REMOVED'
        }
        this.userService.logToUserHistory(
            { telegramId: this.userTelegramId },
            {
                type: 'directDialogApiCall',
                actorTelegramId: this.actorTelegramId,
                apiCall: { method, args, result },
            }
        )

        if (result.success === false) {
            this.chainTasksService.addTask({
                userTelegramId: this.userTelegramId,
                action: {
                    resourceType: 'telegram',
                    actionType: 'sendMessage',
                    dialogType: 'topicDefault',
                    data: {
                        type: 'text',
                        text: [
                            `Telegram api call fails`,
                            '```json',
                            JSON.stringify({ method, args, result }),
                            '```',
                        ].join('\n'),
                        parseMode: 'MarkdownV2',
                    },
                },
            })
            if (result.error instanceof Error) {
                Error.captureStackTrace(result.error, this.callApi)
            }
            throw result.error
        }

        const messageIds = this.extractSendedMessageIds({
            method: method,
            result: result.result,
        } as any)
        if (this.shouldForwardMessagesToTopic && messageIds) {
            this.chainTasksService.addTask({
                userTelegramId: this.userTelegramId,
                action: {
                    resourceType: 'telegram',
                    actionType: 'forwardPrivateMessagesToTopic',
                    dialogType: 'topicDefault',
                    forwardFromChatId: this.userTelegramId,
                    forwardMessageIds: messageIds,
                },
            })
        }

        return result.result
    }

    // =====================
    // Public methods
    // =====================

    /**
     * Wrap method `sendMessage` with force `parse_mode: 'HTML'`
     */
    sendHtml(
        html: string,
        extra?: OmitFields<TelegramDdiMethodArgs<'sendMessage'>, 'text' | 'parse_mode'>
    ) {
        return this.sendMessage({
            ...extra,
            text: html,
            parse_mode: 'HTML',
        })
    }

    deleteMessage(messageId: number) {
        return this.callApi('deleteMessage', {
            chat_id: this.userTelegramId,
            message_id: messageId,
        }).catch((error) => {
            if (
                !(error instanceof TelegramError) ||
                !error.description.includes(`message can't be deleted`)
            ) {
                throw error
            }
            logger.warn(error)
            return true
        })
    }

    deleteMessages(messageIds: number[]) {
        return this.callApi('deleteMessages', {
            chat_id: this.userTelegramId,
            message_ids: messageIds,
        }).catch((error) => {
            if (
                !(error instanceof TelegramError) ||
                !error.description.includes(`message can't be deleted`)
            ) {
                throw error
            }
            logger.warn(error)
            return true as const
        })
    }

    resetMessageInlineKeyboard(messageId: number) {
        return this.editMessageReplyMarkup({
            message_id: messageId,
            reply_markup: undefined,
        }).catch(() => {})
    }

    sendChatAction(action: TelegramMethodArgs<'sendChatAction'>['action']) {
        return this.callApi('sendChatAction', {
            chat_id: this.userTelegramId,
            action,
        })
    }

    async removeOldKeyboard() {
        const message = await this.sendMessage({
            text: '...',
            reply_markup: { remove_keyboard: true },
        })
        return this.deleteMessage(message.message_id)
    }

    async sendMediaContent(
        media: MediaContentWithSendOptions
    ): Promise<{ massageIds: number[]; error: Error | null }> {
        const result = await sendMediaContentViaTelegram({
            telegram: this,
            media,
            target: {
                chatId: this.userTelegramId,
            },
        })

        if (result.error) logger.error(result.error)

        return result
    }

    // =====================
    // Private methods
    // =====================

    private extractSendedMessageIds(args: SomeTelegramMethodResult) {
        if (methods.messageIdResult.includes(args.method)) {
            const result = args.result as MessageId
            return [result.message_id]
        }
        if (methods.messageIdArrayResult.includes(args.method)) {
            const result = args.result as MessageId[]
            return result.map((msg) => msg.message_id)
        }

        return null
    }
}

/**
 * `Method extends any` enables distributive conditional types, ensuring that
 * each `method` in the union is paired with its specific `result` type.
 * Without it, `result` would become a union of all possible return types.
 */
type TelegramMethodResult<Method extends keyof Telegram> = Method extends any
    ? {
          method: Method
          result: ReturnType<Telegram[Method]>
      }
    : never

type SomeTelegramMethodResult = TelegramMethodResult<keyof Telegram>

const methods = {
    messageIdResult: [
        'sendMessage',
        'sendPhoto',
        'sendAudio',
        'sendDocument',
        'sendVideo',
        'sendAnimation',
        'sendVoice',
        'sendVideoNote',
        'sendLocation',
        'sendVenue',
        'sendContact',
        'sendPoll',
        'sendDice',
        'sendSticker',
        'sendInvoice',
        'sendGame',

        'forwardMessage',
        'copyMessage',
    ] as const satisfies MethodsReturning<MessageId>[],
    messageIdArrayResult: [
        'copyMessages',
        'forwardMessages',
        'sendMediaGroup',
    ] as const satisfies MethodsReturning<MessageId[]>[],
}

type MethodsReturning<DesiredType> = {
    [Method in keyof Telegram]: ReturnType<Telegram[Method]> extends DesiredType
        ? Method // Прямое совпадение
        : ReturnType<Telegram[Method]> extends Array<infer Element> // Проверка массивов
          ? Element extends DesiredType
              ? Method
              : DesiredType extends Array<infer DesiredElement>
                ? Element extends DesiredElement
                    ? Method
                    : never
                : never
          : never
}[keyof Telegram]

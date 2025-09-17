import { Telegram } from 'telegraf/types'

/**
 * Telegram api methods type functions have only one argument or have no arguments at all
 */
export type TelegramMethodArgs<Method extends keyof Telegram> = Parameters<
    Telegram[Method]
>[0] extends undefined
    ? never
    : NonNullable<Parameters<Telegram[Method]>[0]>

type KeysOfUnion<T> = T extends T ? keyof T : never
type TelegramSomeMethodArgsProperty = KeysOfUnion<
    Exclude<TelegramMethodArgs<keyof Telegram>, never>
>

type TelegramMethodsWithArgument<Argument extends TelegramSomeMethodArgsProperty> = {
    [Method in keyof Telegram]: TelegramMethodArgs<Method> extends never
        ? never
        : Argument extends KeysOfUnion<TelegramMethodArgs<Method>>
          ? Method
          : never
}[keyof Telegram]

export namespace TelegramPrivateChatApiMethods {
    export type Union = UnionMethodsWithChatId | UnionMethodsWithUserId
    export type UnionMethodsWithChatId = (typeof allCases.methodsWithParamChatId)[number]
    export type UnionMethodsWithUserId = (typeof allCases.methodsWithParamUserId)[number]

    export const allCases = {
        methodsWithParamChatId: [
            'sendMessage',
            'sendPhoto',
            'sendAudio',
            'sendDocument',
            'sendVideo',
            'sendVideoNote',
            'sendVoice',
            'sendAnimation',
            'sendMediaGroup',
            'sendLocation',
            'sendVenue',
            'sendContact',
            'sendPoll',
            'sendDice',
            // 'sendChatAction',
            'sendSticker',
            'sendInvoice',
            'sendGame',

            'forwardMessage',
            'forwardMessages',

            'copyMessage',
            'copyMessages',

            'setMessageReaction',

            'editMessageText',
            'editMessageCaption',
            'editMessageMedia',
            'editMessageReplyMarkup',

            'editMessageLiveLocation',
            'stopMessageLiveLocation',

            'pinChatMessage',
            'unpinChatMessage',
            'unpinAllChatMessages',

            'getChat',

            'getChatMenuButton',
            'setChatMenuButton',

            'stopPoll',
        ] as const satisfies TelegramMethodsWithArgument<'chat_id'>[],

        methodsWithParamUserId: [
            'getUserProfilePhotos',
            // 'uploadStickerFile',
            // 'createNewStickerSet',
            // 'addStickerToSet',
        ] as const satisfies TelegramMethodsWithArgument<'user_id'>[],
    }
}

export type TelegramDdiMethodArgs<Method extends keyof Telegram> = Omit<
    TelegramMethodArgs<Method>,
    'chat_id' | 'user_id' | 'message_thread_id'
>
export type TgCallAsyncResult<Method extends keyof Telegram> = Promise<ReturnType<Telegram[Method]>>
export type TelegramAsync = {
    [Method in keyof Telegram]: TelegramMethodArgs<Method> extends undefined
        ? () => Promise<ReturnType<Telegram[Method]>>
        : (args: TelegramDdiMethodArgs<Method>) => TgCallAsyncResult<Method>
}
export type TelegramDdi = Pick<TelegramAsync, TelegramPrivateChatApiMethods.Union>

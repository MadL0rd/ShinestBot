import { UserProfile } from 'src/entities/user-profile'
import { MessageTyped } from 'src/utils/telegraf-middlewares/inject-message-types'
import { InlineKeyboardButton } from 'telegraf/types'

export namespace MailingMessage {
    export type MessageType = MailingContent['type']

    export type BaseType = {
        shortId?: string
        author?: UserProfile.TelegramInfo
        content: MailingContent
        expireAt?: Date
        delaySecPerSending: number | null
    }

    export type MailingContent = CopiedMessage | ForwardedMessage | CustomMessage

    export type CopiedMessage = {
        type: 'copyContent'
        messageId: number
        originalMessage?: MessageTyped
    }

    export type ForwardedMessage = {
        type: 'forwardedMessage'
        messageId: number
        originalMessage?: MessageTyped
    }

    export type CustomMessage = {
        type: 'custom'
        text: string | null
        photo: string | null
        inlineButtons: InlineKeyboardButton[][]
    } & ({ text: string } | { photo: string })

    export const telegramIdMask = '{{telegramId}}'

    export function generateShortId(length: number = 4): string {
        // "!#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"
        const safeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += safeChars.charAt(Math.floor(Math.random() * safeChars.length))
        }
        return result
    }
}

import { DistinctKeys } from 'node_modules/telegraf/typings/core/helpers/util'
import { Context, MiddlewareFn } from 'telegraf'
import { message } from 'telegraf/filters'
import { PhotoSize, Update } from 'telegraf/types'

type TelegramMessage = Update.MessageUpdate['message']

// Extract all possible keys from Telegram messages
type KeyOfSomeMessage = DistinctKeys<TelegramMessage>

// List of known message types supported in project
const messageTypeNames = [
    'text',
    'audio',
    'document',
    'photo',
    'sticker',
    'video',
    'voice',
    'video_note',
    'contact',
    'location',
    'venue',
    'invoice',
    'story',
] as const satisfies KeyOfSomeMessage[]
type KnownMessageType = (typeof messageTypeNames)[number]
type ExtendedMessageProps = {
    photo: { readonly photoDefaultSize: PhotoSize }
}

// Utility for extracting messages with a specific property
export type MessageWithKey<Key extends KeyOfSomeMessage> = Extract<
    TelegramMessage,
    { [K in Key]?: any }
>

// Message types with specific or 'other' messageType
export type MessageWithSpecificType<MessageType extends KnownMessageType> =
    MessageWithKey<MessageType> & {
        readonly type: MessageType
    } & (MessageType extends keyof ExtendedMessageProps
            ? ExtendedMessageProps[MessageType]
            : object)
type UntypedMessage = Exclude<TelegramMessage, MessageWithKey<KnownMessageType>> & {
    type: 'other'
}

// Combine all possible messages into one type
type MessageTypedLocalOnly = MessageWithSpecificType<KnownMessageType> | UntypedMessage
export type MessageTypeName = MessageTypedLocalOnly['type']

// Update type for messages with added messageType
type MessageTypedUpdate<MessageType extends MessageTypeName> = Update.MessageUpdate<
    MessageType extends KnownMessageType ? MessageWithSpecificType<MessageType> : UntypedMessage
>
export type MessageContextTyped = Context & Context<MessageTypedUpdate<MessageTypeName>>
// Do not figure out why MessageTyped works correctly and MessageTypedLocalOnly doesn't
// But it still works
export type MessageTyped = MessageTypedUpdate<MessageTypeName>['message']

// Middleware to inject `messageType` into the message object
export const injectMessageTypes: MiddlewareFn<MessageContextTyped> = (ctx, next) => {
    if (ctx.updateType === 'message' && 'message' in ctx.update) {
        // Detect the message type or fallback to 'other'
        const detectedType = messageTypeNames.find((type) => message(type)(ctx.update))
        Object.assign(ctx.update.message, { type: detectedType ?? 'other' })

        // Extend props for photo message
        if (ctx.update.message.type === 'photo') {
            Object.assign(ctx.update.message, {
                photoDefaultSize: ctx.update.message.photo.last,
            })
        }
    }
    next()
}

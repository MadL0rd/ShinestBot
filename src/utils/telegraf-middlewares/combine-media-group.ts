import { Context, MiddlewareFn, MiddlewareObj } from 'telegraf'
import {
    MessageContextTyped,
    MessageTyped,
    MessageWithKey,
    MessageWithSpecificType,
} from './inject-message-types'

interface MediaGroupResolvingCache {
    resolve: (value: boolean) => void
    messages: UnknownMediaGroupMessage[]
}
type UnknownMediaGroupMessage = MessageTyped & MessageWithKey<'media_group_id'>

export type MediaGroup =
    | {
          type: 'photosAndVideos'
          messages: (MessageWithSpecificType<'photo'> | MessageWithSpecificType<'video'>)[]
          caption: string | undefined
      }
    | {
          type: 'documents'
          messages: MessageWithSpecificType<'document'>[]
          caption: string | undefined
      }
    | {
          type: 'audio'
          messages: MessageWithSpecificType<'audio'>[]
          caption: string | undefined
      }
    | {
          type: 'other'
          messages: UnknownMediaGroupMessage[]
          caption: string | undefined
      }

export type MediaGroupMessageContext = Context & { mediaGroup?: MediaGroup }

export class MediaGroupCombinerMiddleware<
    ContextType extends MessageContextTyped & MediaGroupMessageContext,
> implements MiddlewareObj<ContextType>
{
    private readonly cache = new Map<string, MediaGroupResolvingCache>()

    constructor(private readonly timeout: number = 100) {}

    middleware(): MiddlewareFn<ContextType> {
        return async (ctx, next) => {
            const message = ctx.message || ctx.channelPost

            // Skip if not a valid media group message
            if (
                !message ||
                !('media_group_id' in message) ||
                !message.media_group_id ||
                !ctx.chat.id
            ) {
                return next()
            }

            const mapKey = `${ctx.chat.id}_${message.media_group_id}`
            const mediaGroup = this.cache.get(mapKey) ?? this.initMediaGroupCache(mapKey)

            // Collect the current message and handle resolution
            mediaGroup.resolve(false)
            mediaGroup.messages.push(message)

            return this.resolveMediaGroup(mediaGroup).then((isLast) => {
                if (!isLast) return

                // Attach sorted media group to the context using Object.assign
                ctx.mediaGroup = this.buildMediaGroup(mediaGroup.messages)

                // Cleanup map
                this.cache.delete(mapKey)
                return next()
            })
        }
    }

    private initMediaGroupCache(mapKey: string): MediaGroupResolvingCache {
        const mediaGroup: MediaGroupResolvingCache = {
            resolve: () => {},
            messages: [],
        }
        this.cache.set(mapKey, mediaGroup)
        return mediaGroup
    }

    private resolveMediaGroup(mediaGroup: MediaGroupResolvingCache): Promise<boolean> {
        return new Promise((resolve) => {
            mediaGroup.resolve = resolve
            setTimeout(() => resolve(true), this.timeout)
        })
    }

    private buildMediaGroup(messages: UnknownMediaGroupMessage[]): MediaGroup | undefined {
        if (messages.isEmpty) return undefined

        const [firstMessage] = messages
        const caption = messages.find((message) => 'caption' in message)?.caption

        switch (firstMessage.type) {
            case 'photo':
            case 'video':
                return {
                    type: 'photosAndVideos',
                    messages: messages as any,
                    caption: caption,
                }

            case 'document':
                return {
                    type: 'documents',
                    messages: messages as any,
                    caption: caption,
                }

            case 'audio':
                return {
                    type: 'audio',
                    messages: messages as any,
                    caption: caption,
                }

            default:
                return {
                    type: 'other',
                    messages: messages,
                    caption: caption,
                }
        }
    }
}

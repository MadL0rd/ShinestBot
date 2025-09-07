import ApiClient from 'node_modules/telegraf/typings/core/network/client'
import { MediaContentWithSendOptions } from 'src/entities/common/media-content.entity'
import {
    InputMediaAudio,
    InputMediaDocument,
    InputMediaPhoto,
    InputMediaVideo,
} from 'telegraf/types'

export async function sendMediaContentViaTelegram(args: {
    telegram: Pick<ApiClient, 'callApi'>
    media: MediaContentWithSendOptions
    target: {
        chatId: number
        messageThreadId?: number
    }
}): Promise<{ massageIds: number[]; error: Error | null }> {
    const { telegram, media, target } = args

    const massageIds: number[] = []
    const errors: unknown[] = []
    const saveError = (error: unknown) => {
        errors.push(error)
    }
    /**
     * Media group: photo and video
     */
    if (media.video.isNotEmpty || media.photo.isNotEmpty) {
        const mediaGroupArgs: (InputMediaPhoto | InputMediaVideo)[] = [
            ...media.video.map((url) => {
                return {
                    type: 'video',
                    media: url,
                } satisfies InputMediaVideo
            }),
            ...media.photo.map((url) => {
                return {
                    type: 'photo',
                    media: url,
                } satisfies InputMediaPhoto
            }),
        ]

        mediaGroupArgs[0].caption = media.caption
        mediaGroupArgs[0].parse_mode = media.parse_mode ?? 'HTML'
        const messages = await telegram
            .callApi('sendMediaGroup', {
                chat_id: target.chatId,
                message_thread_id: target.messageThreadId,
                media: mediaGroupArgs,
            })
            .catch(saveError)
        if (messages) massageIds.concat(messages.map((message) => message.message_id))
    } else if (media.caption?.isNotEmpty === true) {
        const message = await telegram
            .callApi('sendMessage', {
                chat_id: target.chatId,
                message_thread_id: target.messageThreadId,
                text: media.caption,
                parse_mode: media.parse_mode ?? 'HTML',
                link_preview_options: {
                    is_disabled: media.disableWebPagePreview ?? false,
                },
            })
            .catch(saveError)
        if (message) massageIds.push(message.message_id)
    }

    /**
     * Video notes
     */
    if (media.videoNote.isNotEmpty) {
        const newMessageIds = await media.videoNote
            .map(async (videoNote) => {
                const messageId = await telegram
                    .callApi('sendVideoNote', {
                        chat_id: target.chatId,
                        message_thread_id: target.messageThreadId,
                        video_note: videoNote,
                    })
                    .catch(saveError)
                    .then((message) => message?.message_id ?? null)
                return messageId
            })
            .combinePromises()
        massageIds.concat(newMessageIds.filter(Boolean))
    }

    /**
     * Voices
     */
    if (media.voice.isNotEmpty) {
        const newMessageIds = await media.voice
            .map(async (voice) => {
                const messageId = await telegram
                    .callApi('sendVoice', {
                        chat_id: target.chatId,
                        message_thread_id: target.messageThreadId,
                        voice,
                    })
                    .catch(saveError)
                    .then((message) => message?.message_id ?? null)
                return messageId
            })
            .combinePromises()
        massageIds.concat(newMessageIds.filter(Boolean))
    }

    /**
     * Media group: audio
     */
    if (media.audio.isNotEmpty) {
        const audioGroupArgs: InputMediaAudio[] = media.audio.map((url) => {
            return {
                type: 'audio',
                media: url,
            }
        })

        audioGroupArgs[0].caption = media.caption
        audioGroupArgs[0].parse_mode = media.parse_mode ?? 'HTML'
        const messages = await telegram
            .callApi('sendMediaGroup', {
                chat_id: target.chatId,
                message_thread_id: target.messageThreadId,
                media: audioGroupArgs,
            })
            .catch(saveError)
        if (messages) massageIds.concat(messages.map((message) => message.message_id))
    }

    /**
     * Media group: documents
     */
    if (media.document.isNotEmpty) {
        const docsGroupArgs: InputMediaDocument[] = media.document.map((url) => {
            return {
                type: 'document',
                media: url,
            }
        })

        docsGroupArgs[0].caption = media.caption
        docsGroupArgs[0].parse_mode = media.parse_mode ?? 'HTML'
        const messages = await telegram
            .callApi('sendMediaGroup', {
                chat_id: target.chatId,
                message_thread_id: target.messageThreadId,
                media: docsGroupArgs,
            })
            .catch(saveError)
        if (messages) massageIds.concat(messages.map((message) => message.message_id))
    }

    /**
     * Animation
     */
    if (media.animation.isNotEmpty) {
        const newMessageIds = await media.animation
            .map(async (animation) => {
                return await telegram
                    .callApi('sendAnimation', {
                        chat_id: target.chatId,
                        message_thread_id: target.messageThreadId,
                        animation,
                    })
                    .catch(saveError)
                    .then((message) => message?.message_id ?? null)
            })
            .combinePromises()
        massageIds.concat(newMessageIds.filter(Boolean))
    }

    /**
     * Stickers
     */
    if (media.sticker.isNotEmpty) {
        const newMessageIds = await media.sticker
            .map(async (sticker) => {
                return await telegram
                    .callApi('sendSticker', {
                        chat_id: target.chatId,
                        message_thread_id: target.messageThreadId,
                        sticker,
                    })
                    .catch(saveError)
                    .then((message) => message?.message_id ?? null)
            })
            .combinePromises()
        massageIds.concat(newMessageIds.filter(Boolean))
    }

    return {
        massageIds,
        error: errors.isEmpty
            ? null
            : new AggregateError(
                  errors,
                  `Media content send failed. Target: ${JSON.stringify(target)}`
              ),
    }
}

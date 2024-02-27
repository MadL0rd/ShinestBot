import { InjectBot, On, Start, Update as UpdateNest } from 'nestjs-telegraf'
import { Telegraf, Context } from 'telegraf'
import { Update, Message } from 'node_modules/telegraf/typings/core/types/typegram'
import { logger } from 'src/app.logger'
import { internalConstants } from './app.internal-constants'
import { RuntimeExeptionGuard } from './exeptions-and-logging/runtime-exeption-guard.decorator'
import { PrivateDialogDispatcherService } from './presentation/dispatchers/private-dialog-dispatcher/private-dialog-dispatcher.service'

@UpdateNest()
export class AppUpdate {
    // =====================
    // Properties
    // =====================

    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly privateDialogDispatcher: PrivateDialogDispatcherService
    ) {}

    // =====================
    // Methods
    // =====================

    @Start()
    @RuntimeExeptionGuard
    async startCommand(ctx: Context<Update>) {
        if (ctx.chat?.type !== 'private') return
        logger.log(`User ${ctx.from?.id} ${ctx.from?.first_name} has started the bot`)
        await this.privateDialogDispatcher.handleUserStart(ctx)
    }

    @On([
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
    ])
    @RuntimeExeptionGuard
    async on(ctx: Context<Update>) {
        const message = ctx.message as Message.TextMessage
        const messageText = message?.text
        if (messageText) {
            logger.log(
                `User ${ctx.from?.id} ${ctx.from?.first_name} has sent a message: "${messageText}"`
            )
        } else {
            const messageJsonString = JSON.stringify(ctx.message)
            logger.log(`From ${ctx.from?.id} ${ctx.from?.first_name} receive ${messageJsonString}`)
        }

        if (ctx.chat?.type === 'private') {
            // Message from private chat with user
            await this.privateDialogDispatcher.handleUserMessage(ctx)
        } else if (ctx.chat?.id == internalConstants.fileStorageChatId) {
            // Message in file storage chat

            const textMessage = ctx.message as Message.TextMessage
            const messageText = textMessage.text as string
            if (messageText && messageText.includes(':')) {
                const commandComponents = messageText
                    .split(':')
                    .map((component) => component.trimmed)
                if (commandComponents.length != 2) return

                const fileId = commandComponents[1]
                try {
                    switch (commandComponents[0]) {
                        case 'video':
                            await ctx.sendVideo(fileId)
                            return
                        case 'photo':
                            await ctx.sendPhoto(fileId)
                            return
                        case 'audio':
                            await ctx.sendAudio(fileId)
                            return
                        case 'document':
                            await ctx.sendDocument(fileId)
                            return
                    }
                } catch {
                    await ctx.sendMessage('Не удалось отправить файл')
                    return
                }
            }

            // Photo
            const messagePhoto = ctx.message as Message.PhotoMessage
            const photoFileId = messagePhoto?.photo?.last?.file_id
            if (photoFileId) {
                await ctx.reply(photoFileId)
            }

            // Video
            const messageVideo = ctx.message as Message.VideoMessage
            const videoFileId = messageVideo?.video?.file_id
            if (videoFileId) {
                await ctx.reply(videoFileId)
            }

            // Audio
            const messageAudio = ctx.message as Message.AudioMessage
            const audioFileId = messageAudio?.audio?.file_id
            if (audioFileId) {
                await ctx.reply(audioFileId)
            }

            // Document
            const messageDocument = ctx.message as Message.DocumentMessage
            const documentFileId = messageDocument?.document?.file_id
            if (documentFileId) {
                await ctx.reply(documentFileId)
            }
        } else {
            logger.log(`ChatId ${ctx.chat?.id}`)
        }
    }

    @On(['callback_query'])
    @RuntimeExeptionGuard
    async onInlineButton(ctx: Context<Update.CallbackQueryUpdate>) {
        logger.log(
            `User ${ctx.from?.id} ${ctx.from?.first_name} pressed the inline button ${ctx.callbackQuery}"`
        )
        logger.log(ctx.callbackQuery)

        if (ctx.chat?.type === 'private') {
            // Message from private chat with user
            await this.privateDialogDispatcher.handleUserCallback(ctx)
        }
    }
}

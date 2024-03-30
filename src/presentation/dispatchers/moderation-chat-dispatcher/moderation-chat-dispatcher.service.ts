import { Injectable } from '@nestjs/common'
import { Context, Markup, Telegraf } from 'telegraf'
import { InlineKeyboardButton, Message, Update } from 'telegraf/types'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { getLanguageFor } from 'src/utils/getLanguageForUser'
import { SurveyFormatter } from 'src/utils/survey-formatter'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { MediaGroup } from 'node_modules/telegraf/typings/telegram-types'
import { SurveyUsageHelpers } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UniqueMessage } from 'src/business-logic/bot-content/schemas/models/bot-content.unique-message'
import { PublicationStatus } from 'src/business-logic/publication-storage/enums/publication-status.enum'
import { InjectBot } from 'nestjs-telegraf'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'

@Injectable()
export class ModerationChatDispatcherService {
    // ======================
    // Properties
    // ======================

    constructor(
        private readonly botContentService: BotContentService,
        private readonly userService: UserService,
        private readonly publicationStorageService: PublicationStorageService,
        private readonly moderatedPublicationService: ModeratedPublicationsService,
        @InjectBot() private readonly bot: Telegraf
    ) {}

    // =====================
    // Public methods
    // =====================

    async handleUserMessage(ctx: Context<Update>): Promise<void> {
        const message = ctx.message && 'text' in ctx.message ? ctx.message : undefined
        const messageText = message?.text

        // Store Publication moderationChatServiceMessageId if needed
        if (
            messageText &&
            messageText.startsWith(internalConstants.loadingServiceChatMessagePrefix) &&
            ctx.from?.first_name == 'Telegram'
        ) {
            await this.moderatedPublicationService.syncronizeModerationMessage(message)
            return
        }

        const threadMessageId = ctx.message?.message_thread_id
        if (!threadMessageId) return

        const publication = await this.publicationStorageService.findByRepliedMessageThreadId(
            threadMessageId
        )
        if (!publication) {
            logger.log(`Cannot find publication with thread message id ${threadMessageId}`)
            return
        }
        // TODO: добавить проверку на модера сюда
        const botContent = await this.botContentService.getContent(
            internalConstants.defaultLanguage
        )
        if (messageText) {
            switch (messageText) {
                case botContent.uniqueMessage.moderation.messageCommandApprove:
                    await this.handlePublicationApprove(publication, ctx)
                    return

                case botContent.uniqueMessage.moderation.messageCommandReject:
                    await this.handlePublicationReject(publication, ctx, botContent.uniqueMessage)
                    return

                case botContent.uniqueMessage.moderation.messageCommandNotRelevant:
                    await this.handlePublicationNotRelevant(publication, ctx)
                    return
            }
        }

        await this.sendAdminMessageTextForPublication(publication)
        await this.replyAdminMessageToUser(ctx, publication.userTelegramId)
    }
    // =====================
    // Private methods
    // =====================

    private async handlePublicationApprove(publication: PublicationDocument, ctx: Context<Update>) {
        const publicationStatusModeration: PublicationStatus.Union = 'moderation'
        if (publication.status != publicationStatusModeration) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Опубликовать объявление можно только если заявка находится на рассмотрении'
            )
            return
        }
        let publicationUpdated = await this.publicationStorageService.findById(
            publication._id.toString()
        )
        if (!publicationUpdated) {
            logger.error(`Cannot find publication by id: ${publication._id.toString()}`)
            return
        }

        // Create main channel publication
        const inlineKeyboardMainPublication: InlineKeyboardButton[][] = []

        // Try to find media
        const mediaGroupArgs: MediaGroup = publicationUpdated.answers
            .filter(
                (answer) =>
                    answer.question.addAnswerToTelegramPublication &&
                    SurveyUsageHelpers.isMediaType(answer.type)
            )
            .compactMap((answer) => {
                return 'media' in answer ? answer.media : null
            })
            .flat()
            .map((media) => {
                return {
                    type: media.fileType,
                    media: media.telegramFileId,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false,
                    reply_markup: {
                        inline_keyboard: inlineKeyboardMainPublication,
                    },
                }
            })

        let mainChannelPost: Message
        const botContent = await this.botContentService.getContent(
            internalConstants.defaultLanguage
        )
        const mainChannelPostText = SurveyFormatter.generateTextFromPassedAnswers(
            {
                contentLanguage: internalConstants.defaultLanguage,
                passedAnswers: publicationUpdated.answers,
            },
            botContent
        )
        if (!internalConstants.publicationMainChannelId) {
            logger.error('Cannot find publicationMainChannelId in internalConstants')
            return
        }
        if (mediaGroupArgs.length > 0) {
            mediaGroupArgs[0]['caption'] = mainChannelPostText
            const mainChannelMessages = await ctx.telegram.sendMediaGroup(
                internalConstants.publicationMainChannelId,
                mediaGroupArgs
            )
            const mainChannelPostRaw = mainChannelMessages.filter(
                (message) => message.caption
            ).first
            if (!mainChannelPostRaw) {
                logger.error('Cannot find mainChannelPostRaw')
                return
            }
            mainChannelPost = mainChannelPostRaw
        } else {
            mainChannelPost = await ctx.telegram.sendMessage(
                internalConstants.publicationMainChannelId,
                mainChannelPostText,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: inlineKeyboardMainPublication,
                    },
                }
            )
        }

        publicationUpdated = await this.publicationStorageService.update(
            publicationUpdated._id.toString(),
            {
                mainChannelPublicationId: mainChannelPost.message_id,
            }
        )

        const publicationId = publication._id.toString()
        await this.moderatedPublicationService.updatePublicationStatus(publicationId, 'active')

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePublicationReject(
        publication: PublicationDocument,
        ctx: Context<Update>,
        text: UniqueMessage
    ) {
        const statusModeration: PublicationStatus.Union = 'moderation'
        if (publication.status != statusModeration || publication.mainChannelPublicationId) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Установить статус "Отклонено" можно только если заявка находится на рассмотрении'
            )
            return
        }

        const publicationId = publication._id.toString()
        await this.moderatedPublicationService.updatePublicationStatus(publicationId, 'rejected')

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePublicationNotRelevant(
        publication: PublicationDocument,
        ctx: Context<Update>
    ) {
        const publicationStatusActive: PublicationStatus.Union = 'active'
        if (publication.status != publicationStatusActive) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Установить статус "Не актуально" можно только если объявление было опубликовано и его текущий статус "Актуально"'
            )
            return
        }

        const publicationId = publication._id.toString()
        await this.moderatedPublicationService.updatePublicationStatus(publicationId, 'notRelevant')

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async replyAdminMessageToUser(
        ctx: Context<Update>,
        userTelegramId: number
    ): Promise<void> {
        const textMessage = ctx.message as Message.TextMessage
        if (textMessage.text) {
            await this.bot.telegram.sendMessage(userTelegramId, textMessage.text)
        }

        const stickerMessage = ctx.message as Message.StickerMessage
        if (stickerMessage?.sticker?.file_id) {
            await this.bot.telegram.sendSticker(userTelegramId, stickerMessage.sticker.file_id)
        }

        // Photo
        const messagePhoto = ctx.message as Message.PhotoMessage
        const photoFileId = messagePhoto?.photo?.last?.file_id
        if (photoFileId) {
            await this.bot.telegram.sendPhoto(userTelegramId, photoFileId)
        }

        // Video
        const messageVideo = ctx.message as Message.VideoMessage
        const videoFileId = messageVideo?.video?.file_id
        if (videoFileId) {
            await this.bot.telegram.sendVideo(userTelegramId, videoFileId)
        }

        // Audio
        const messageAudio = ctx.message as Message.AudioMessage
        const audioFileId = messageAudio?.audio?.file_id
        if (audioFileId) {
            await this.bot.telegram.sendAudio(userTelegramId, audioFileId)
        }

        // Document
        const messageDocument = ctx.message as Message.DocumentMessage
        const documentFileId = messageDocument?.document?.file_id
        if (documentFileId) {
            await this.bot.telegram.sendDocument(userTelegramId, documentFileId)
        }
    }

    private async sendAdminMessageTextForPublication(
        publication: PublicationDocument
    ): Promise<string | null> {
        const userId = publication.userTelegramId

        const user = await this.userService.findOneByTelegramId(userId)
        if (!user) {
            logger.error(`Cannot find user by id: ${userId} `)
            return null
        }
        const userLanguage = getLanguageFor(user)
        const botContent = await this.botContentService.getContent(userLanguage)
        const adminMessageText = SurveyFormatter.makeUserMessageWithPublicationInfo(
            botContent.uniqueMessage.moderation.messageText,
            publication,
            botContent.uniqueMessage
        )
        await this.bot.telegram.sendMessage(userId, adminMessageText, {
            parse_mode: 'HTML',
        })
        return ''
    }

    // =====================
    // Private methods
    // =====================

    private async sendSuccessMessageToCurrentThread(ctx: Context<Update>) {
        await this.sendMessageToCurrentThread(ctx, 'Операция выполнена успешно')
    }

    private async sendMessageToCurrentThread(ctx: Context<Update>, messageText: string) {
        if (!ctx.chat) {
            logger.error('Cannot find ctx')
            return
        }
        if (!ctx.message || !ctx.message.message_thread_id) {
            logger.error('Cannot previous message')
            return
        }
        await ctx.telegram.sendMessage(ctx.chat.id, messageText, {
            reply_parameters: { message_id: ctx.message.message_thread_id },
            parse_mode: 'HTML',
        })
    }
}

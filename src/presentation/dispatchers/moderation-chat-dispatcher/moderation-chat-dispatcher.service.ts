import { Injectable } from '@nestjs/common'
import { Context, Markup, Telegraf } from 'telegraf'
import { InlineKeyboardButton, Message, Update } from 'telegraf/types'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { setTimeout } from 'timers/promises'
import { getLanguageFor } from 'src/utils/getLanguageForUser'
import { SurveyFormatter } from 'src/utils/survey-formatter'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { MediaGroup } from 'node_modules/telegraf/typings/telegram-types'
import { SurveyUsageHelpers } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UniqueMessage } from 'src/business-logic/bot-content/schemas/models/bot-content.unique-message'
import { PublicationStatus } from 'src/business-logic/publication-storage/enums/publication-status.enum'
import { InjectBot } from 'nestjs-telegraf'
import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'

@Injectable()
export class ModerationChatDispatcherService {
    // ======================
    // Properties
    // ======================

    constructor(
        private readonly botContentService: BotContentService,
        private readonly userService: UserService,
        private readonly publicationStorageService: PublicationStorageService,
        @InjectBot() private readonly bot: Telegraf
    ) {}

    // =====================
    // Public methods
    // =====================

    async handleUserMessage(ctx: Context<Update>): Promise<void> {
        const message = ctx.message as Message.TextMessage
        const messageText = message?.text

        // Store Publication moderationChatServiceMessageId if needed
        if (
            messageText &&
            messageText.startsWith(internalConstants.loadingServiceChatMessagePrefix) &&
            ctx.from?.first_name == 'Telegram'
        ) {
            const publicationId = messageText.split('\n')[1]?.split(':')[1]?.trimmed
            if (!publicationId) {
                logger.log(`Cannot parse publication Id`)
                return
            }
            let publication = await this.publicationStorageService.findById(publicationId)
            if (!publication) {
                logger.log(`Cannot find publication with id ${publicationId}`)
                return
            }

            publication = await this.publicationStorageService.update(publicationId, {
                moderationChatThreadMessageId: ctx.message?.message_id,
            })

            // =====================
            //
            // This bunch of code need to synchonize concurrent telegram messages receive evevnts
            // 1. Scene pushes publication to database
            // 2. Scene sends message to moderation chat
            // - This dispatcher can handle service message before scene receive the sended message object
            // So we will wait for scene to set moderationChannelPublicationId
            //
            // Maybe we will refactor this later
            //
            let timeoutCount = 0
            const timeoutMaxCount = 10
            while (!publication?.moderationChannelPublicationId) {
                if (timeoutCount >= timeoutMaxCount) {
                    logger.error(
                        `Cannot find publication.moderationChannelPublicationId with id${publicationId}`
                    )
                    return
                }
                logger.log(
                    `Timeout cause cannot find publication.moderationChannelPublicationId whith id ${publicationId}`
                )
                await setTimeout(3000)
                publication = await this.publicationStorageService.findById(publicationId)
                timeoutCount++
            }
            //
            // =====================

            const user = await this.userService.findOneByTelegramId(publication.userTelegramId)
            if (!user) {
                logger.log(`Cannot find user with id ${publication.userTelegramId}`)
                return
            }
            const language = internalConstants.defaultLanguage
            const botContent = await this.botContentService.getContent(language)
            if (!internalConstants.moderationChannelId) {
                logger.error(`Wrong moderationChannelId in env`)
                return
            }
            const editedText = SurveyFormatter.generateTextFromPassedAnswers(
                {
                    contentLanguage: publication.language,
                    passedAnswers: publication.answers,
                },
                botContent
            )
            await ctx.telegram.editMessageText(
                internalConstants.moderationChannelId,
                publication.moderationChannelPublicationId,
                undefined,
                editedText,
                {
                    parse_mode: 'HTML',
                    link_preview_options: { is_disabled: true },
                }
            )
            await this.sendPublicationsMediaToModerationThread(ctx, publication)

            let moderationCommandsText = `Актуальные на данный момент комманды:\n`
            moderationCommandsText += [
                botContent.uniqueMessage.moderation.messageCommandApprove,
                botContent.uniqueMessage.moderation.messageCommandReject,
                botContent.uniqueMessage.moderation.messageCommandNotRelevant,
            ]
                .map((command) => `- ${command}`)
                .join('\n')

            if (!ctx.chat) {
                logger.error('Cannot find moderation chat')
                return
            }
            if (!ctx.message) {
                logger.error('Cannot find preveous message moderation chat')
                return
            }
            await ctx.telegram.sendMessage(ctx.chat.id, moderationCommandsText, {
                reply_parameters: { message_id: ctx.message.message_id },
                parse_mode: 'HTML',
            })
            return
        }

        if (!ctx.message) {
            logger.error('Cannot find preveous message')
            return
        }
        const threadMessageId = ctx.message.message_thread_id
        if (!threadMessageId) return

        const publication = await this.publicationStorageService.findByRepliedMessageThreadId(
            threadMessageId
        )
        if (!publication) {
            logger.log(`Cannot find publication with thread message id ${threadMessageId}`)
        } else {
            // TODO: добавить проверку на модера сюда
            const botContent = await this.botContentService.getContent(
                internalConstants.defaultLanguage
            )
            if (messageText) {
                switch (messageText) {
                    case botContent.uniqueMessage.moderation.messageCommandApprove:
                        await this.handlePublicationApprove(
                            publication,
                            ctx,
                            botContent.uniqueMessage
                        )
                        return

                    case botContent.uniqueMessage.moderation.messageCommandReject:
                        await this.handlePublicationReject(
                            publication,
                            ctx,
                            botContent.uniqueMessage
                        )
                        return

                    case botContent.uniqueMessage.moderation.messageCommandNotRelevant:
                        await this.handlePublicationNotRelevant(
                            publication,
                            ctx,
                            botContent.uniqueMessage
                        )
                        return
                }
            }

            await this.sendAdminMessageTextForPublication(publication)
            await this.replyAdminMessageToUser(ctx, publication.userTelegramId)
        }
    }
    // =====================
    // Private methods
    // =====================

    private async updatePublicationStatus(
        publicationDocument: PublicationDocument | null,
        status: PublicationStatus.Union,
        ctx: Context<Update>,
        text: BotContent
    ) {
        if (!publicationDocument) return
        publicationDocument = await this.publicationStorageService.update(
            publicationDocument._id.toString(),
            {
                status: status,
            }
        )

        const inlineKeyboardAll: InlineKeyboardButton[][] = []
        const inlineKeyboardMainPublication: InlineKeyboardButton[][] = []
        if (!publicationDocument) return
        const telegramLink = SurveyFormatter.publicationTelegramLink(publicationDocument)
        if (telegramLink) {
            inlineKeyboardAll.push([
                Markup.button.url(
                    text.uniqueMessage.userPublications.buttonLinkTelegram,
                    telegramLink
                ),
            ])
        }

        // Update status in moderation channel
        if (publicationDocument.moderationChannelPublicationId) {
            try {
                const user = await this.userService.findOneByTelegramId(
                    publicationDocument.userTelegramId
                )
                if (!internalConstants.moderationChannelId || !user) return
                await ctx.telegram.editMessageText(
                    internalConstants.moderationChannelId,
                    publicationDocument.moderationChannelPublicationId,
                    undefined,
                    SurveyFormatter.moderationSynchronizedText(
                        publicationDocument,
                        text.uniqueMessage,
                        user
                    ),
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true },
                    }
                )
            } catch {}
        }

        // Update status in main channel
        if (publicationDocument.mainChannelPublicationId) {
            try {
                if (!internalConstants.publicationMainChannelId) return
                await ctx.telegram.editMessageText(
                    internalConstants.publicationMainChannelId,
                    publicationDocument.mainChannelPublicationId,
                    undefined,
                    SurveyFormatter.postPublicationText(publicationDocument, text.uniqueMessage),
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true },
                        reply_markup: {
                            inline_keyboard: inlineKeyboardMainPublication,
                        },
                    }
                )
            } catch {}

            try {
                await ctx.telegram.editMessageCaption(
                    internalConstants.publicationMainChannelId,
                    publicationDocument.mainChannelPublicationId,
                    undefined,
                    SurveyFormatter.postPublicationText(publicationDocument, text.uniqueMessage),
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: inlineKeyboardMainPublication,
                        },
                    }
                )
            } catch {}
        }

        // Notify user
        let textForUser = ''
        switch (status) {
            case 'moderation':
                return

            case 'rejected':
                textForUser = text.uniqueMessage.moderation.messageTextRejected
                break

            case 'active':
                textForUser = text.uniqueMessage.moderation.messageTextAccepted
                break

            case 'notRelevant':
                textForUser = text.uniqueMessage.moderation.messageTextNotRelevant
                break
        }
        const moderationMessageText = SurveyFormatter.makeUserMessageWithPublicationInfo(
            textForUser,
            publicationDocument,
            text.uniqueMessage
        )
        await ctx.telegram.sendMessage(publicationDocument.userTelegramId, moderationMessageText, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: {
                inline_keyboard: inlineKeyboardAll,
            },
        })
    }

    private async handlePublicationApprove(
        publication: PublicationDocument,
        ctx: Context<Update>,
        text: UniqueMessage
    ) {
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

        // TODO: Написать статус апдейтер
        await this.updatePublicationStatus(publicationUpdated, 'active', ctx, botContent)

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePublicationReject(
        publication: PublicationDocument,
        ctx: Context<Update>,
        text: UniqueMessage
    ) {
        const botContent = await this.botContentService.getContent(
            internalConstants.defaultLanguage
        )
        const statusModeration: PublicationStatus.Union = 'moderation'
        if (publication.status != statusModeration || publication.mainChannelPublicationId) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Установить статус "Отклонено" можно только если заявка находится на рассмотрении'
            )
            return
        }
        // TODO: Написать апдейтер
        await this.updatePublicationStatus(publication, 'moderation', ctx, botContent)

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePublicationNotRelevant(
        publication: PublicationDocument,
        ctx: Context<Update>,
        text: UniqueMessage
    ) {
        const botContent = await this.botContentService.getContent(
            internalConstants.defaultLanguage
        )
        const publicationStatusActive: PublicationStatus.Union = 'active'
        if (publication.status != publicationStatusActive) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Установить статус "Не актуально" можно только если объявление было опубликовано и его текущий статус "Актуально"'
            )
            return
        }
        // TODO: Написать апдейтер
        await this.updatePublicationStatus(publication, 'notRelevant', ctx, botContent)

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

    private async sendPublicationsMediaToModerationThread(
        ctx: Context<Update>,
        publication: PublicationDocument
    ) {
        for (const answer of publication.answers) {
            if (
                ('media' in answer && !answer.media) ||
                ('media' in answer && answer.media.length == 0)
            )
                continue
            if ('media' in answer) {
                const mediaGroupArgs: MediaGroup = answer.media?.map((media) => {
                    return {
                        type: media.fileType,
                        media: media.telegramFileId,
                        parse_mode: 'HTML',
                    }
                })

                let caption = answer.question.publicTitle
                caption += '\n\n<i>Будет отображаться в публикации: <b>'
                caption += answer.question.addAnswerToTelegramPublication ? 'Да' : 'Нет'
                caption += '</b></i>'
                mediaGroupArgs[0]['caption'] = caption

                if (ctx.chat && ctx.message) {
                    await ctx.telegram.sendMediaGroup(ctx.chat.id, mediaGroupArgs, {
                        reply_parameters: { message_id: ctx.message.message_id },
                    })
                } else {
                    logger.error('Cannot send publicationsmedia to chat')
                }
            }
        }
    }
}

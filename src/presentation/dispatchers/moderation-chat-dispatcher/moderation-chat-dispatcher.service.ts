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
import {
    SurveyCacheHelpers,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UniqueMessage } from 'src/business-logic/bot-content/schemas/models/bot-content.unique-message'
import { PublicationStatus } from 'src/business-logic/publication-storage/enums/publication-status.enum'
import { InjectBot } from 'nestjs-telegraf'

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
                logger.log(`Cannot parse realEstateAdvertId`)
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
            logger.log(`Cannot find realEstateAdvert with thread message id ${threadMessageId}`)
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
                        await this.handleAdvertReject(publication, ctx, botContent.uniqueMessage)
                        return

                    case botContent.uniqueMessage.moderation.messageCommandNotRelevant:
                        await this.handleAdvertNotRelevant(
                            publication,
                            ctx,
                            botContent.uniqueMessage
                        )
                        return
                }
            }

            await this.sendAdminMessageTextForAdvert(publication)
            await this.replyAdminMessageToUser(ctx, publication.userTelegramId)
        }
    }
    // =====================
    // Private methods
    // =====================

    private async updatePublication(
        publicationDocument: PublicationDocument | null,
        status: PublicationStatus.Union,
        ctx: Context<Update>,
        text: UniqueMessage
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
        const telegramLink = advertFormatter.advertPublicationTelegramLink(publicationDocument)
        if (telegramLink) {
            inlineKeyboardAll.push([
                Markup.button.url(text.userAdvertsButtonLinkTelegram, telegramLink),
            ])
        }

        const webPageUrl = advertFormatter.advertPublicationWebLink(publicationDocument)
        if (webPageUrl) {
            const webLinkButton = Markup.button.url(text.userAdvertsButtonLinkWeb, webPageUrl)
            inlineKeyboardAll.push([webLinkButton])
            inlineKeyboardMainPublication.push([webLinkButton])
        }

        // Update status in moderation channel
        if (publicationDocument.moderationChannelPostId) {
            try {
                const user = await this.userService.findOneByTelegramId(
                    publicationDocument.userTelegramId
                )
                await ctx.telegram.editMessageText(
                    internalConstants.moderationChannelId,
                    publicationDocument.moderationChannelPostId,
                    undefined,
                    advertFormatter.moderationSynchronizedText(publicationDocument, text, user),
                    {
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                    }
                )
            } catch {}
        }

        // Update status in main channel
        if (publicationDocument.mainChannelPostId) {
            try {
                await ctx.telegram.editMessageText(
                    internalConstants.advertsMainChannelId,
                    publicationDocument.mainChannelPostId,
                    undefined,
                    advertFormatter.postPublicationText(publicationDocument, text),
                    {
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                        reply_markup: {
                            inline_keyboard: inlineKeyboardMainPublication,
                        },
                    }
                )
            } catch {}

            try {
                await ctx.telegram.editMessageCaption(
                    internalConstants.advertsMainChannelId,
                    publicationDocument.mainChannelPostId,
                    undefined,
                    advertFormatter.postPublicationText(publicationDocument, text),
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
            case RealEstateAdvertStatus.moderation:
                return

            case RealEstateAdvertStatus.rejected:
                textForUser = text.moderationMessageTextRejected
                break

            case RealEstateAdvertStatus.active:
                textForUser = text.moderationMessageTextAccepted
                break

            case RealEstateAdvertStatus.notRelevant:
                textForUser = text.moderationMessageTextNotRelevant
                break
        }
        const moderationMessageText = advertFormatter.makeUserMessageWithAdvertInfo(
            textForUser,
            publicationDocument,
            text
        )
        await ctx.telegram.sendMessage(publicationDocument.userTelegramId, moderationMessageText, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: inlineKeyboardAll,
            },
        })

        // Send notifications for other users
        if (status != RealEstateAdvertStatus.active) return
        const notificationText = advertFormatter.makeUserMessageWithAdvertInfo(
            text.moderationMessageTextNewSearchResult,
            publicationDocument,
            text
        )

        const allTelegramIds = await this.userService.findAllUserIdsWithActiveNotifications()
        for (const id of allTelegramIds) {
            const user = await this.userService.findOneById(id)

            if (user.telegramId == publicationDocument.userTelegramId) continue
            if (
                !doesAdvertPassSearchFilters(publicationDocument, user.internalInfo.searchFilters)
            ) {
                continue
            }

            try {
                await ctx.telegram.sendMessage(user.telegramId, notificationText, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: inlineKeyboardAll,
                    },
                })
            } catch {
                logger.error(
                    `Failed to send message to user: ${user.telegramId} @${user.telegramInfo.username}`
                )
                this.userService.logToUserHistory(user, UserHistoryEvent.botIsBlockedDetected)
            }
        }
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
                    type:
                        typeof media == SurveyCacheHelpers.answerTypeNames.video
                            ? 'video'
                            : 'photo',
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
        if (!internalConstants.advertsMainChannelId) {
            logger.error('Cannot find advertsMainChannelId in internalConstants')
            return
        }
        if (mediaGroupArgs.length > 0) {
            mediaGroupArgs[0]['caption'] = mainChannelPostText
            const mainChannelMessages = await ctx.telegram.sendMediaGroup(
                internalConstants.advertsMainChannelId,
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
                internalConstants.advertsMainChannelId,
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
        // const updater = new AdvertStatusUpdater(this.userService, this.realEstateAdvertService)
        // await updater.update(publicationUpdated, RealEstateAdvertStatus.active, ctx, text)

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handleAdvertReject(
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
        // TODO: Написать апдейтер
        // const updater = new AdvertStatusUpdater(this.userService, this.realEstateAdvertService)
        // updater.update(realEstateAdvert, RealEstateAdvertStatus.rejected, ctx, text)

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handleAdvertNotRelevant(
        realEstateAdvert: PublicationDocument,
        ctx: Context<Update>,
        text: UniqueMessage
    ) {
        const publicationStatusActive: PublicationStatus.Union = 'active'
        if (realEstateAdvert.status != publicationStatusActive) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Установить статус "Не актуально" можно только если объявление было опубликовано и его текущий статус "Актуально"'
            )
            return
        }
        // TODO: Написать апдейтер
        // const updater = new AdvertStatusUpdater(this.userService, this.realEstateAdvertService)
        // updater.update(realEstateAdvert, RealEstateAdvertStatus.notRelevant, ctx, text)

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

    private async sendAdminMessageTextForAdvert(
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
        const adminMessageText = SurveyFormatter.makeUserMessageWithAdvertInfo(
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

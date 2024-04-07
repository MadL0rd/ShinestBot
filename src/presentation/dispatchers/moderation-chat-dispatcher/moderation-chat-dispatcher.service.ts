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
import { InjectBot } from 'nestjs-telegraf'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'
import { generateInlineButtonSegue } from 'src/presentation/utils/inline-button.utils'
import { SceneCallbackAction } from 'src/presentation/scenes/models/scene-callback'
import { getActiveUserPermissionNames } from 'src/utils/getActiveUserPermissions'
import { User } from 'src/business-logic/user/schemas/user.schema'

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

        const user = await this.userService.findOneByTelegramId(ctx.message.from.id)
        const activeUserPermissionNames = user ? getActiveUserPermissionNames(user) : []
        if (
            !user ||
            (!activeUserPermissionNames.includes('admin') &&
                !activeUserPermissionNames.includes('owner'))
        ) {
            await this.sendMessageToCurrentThread(ctx, 'Access denied')
            const userJsonString = JSON.stringify(ctx.from)
            logger.error(
                `В модераторском чате обраружен кто-то лишний. Решите вопрос!\n${userJsonString}`
            )
            return
        }

        const botContent = await this.botContentService.getContent(
            internalConstants.defaultLanguage
        )
        if (messageText) {
            switch (messageText) {
                case botContent.uniqueMessage.moderationCommand.approve:
                    await this.handlePublicationApprove(publication, ctx)
                    return

                case botContent.uniqueMessage.moderationCommand.reject:
                    await this.handlePublicationReject(publication, ctx)
                    return

                case botContent.uniqueMessage.moderationCommand.notRelevant:
                    await this.handlePublicationNotRelevant(publication, ctx)
                    return

                case botContent.uniqueMessage.moderationCommand.edit:
                    await this.handleEditPublication(user, publication, ctx)
                    return
            }
        }

        if (messageText?.split(' ').first == botContent.uniqueMessage.moderationCommand.place) {
            await this.handlePlacePublication(publication, ctx)
            return
        }

        await this.sendAdminMessageTextForPublication(publication)
        await this.replyAdminMessageToUser(ctx, publication.userTelegramId)
    }
    // =====================
    // Private methods
    // =====================

    private async handleEditPublication(
        admin: User,
        publication: PublicationDocument,
        ctx: Context<Update>
    ) {
        // if (publication.status == 'notRelevant' || publication.status == 'rejected') {
        //     await this.sendMessageToCurrentThread(
        //         ctx,
        //         "Нельзя перевести в режим ручного редактирования заявки со статусом 'Не актуально' или 'Отклонено'"
        //     )
        // }
        if (!ctx.message) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Не найдено предыдущее сообщения для обработки'
            )
            return
        }

        admin.internalInfo.adminsOnly.modifyingPublicationIdPrepared = publication._id.toString()
        await this.userService.update(admin)

        const inlineKeyboard: InlineKeyboardButton[][] = []
        inlineKeyboard.push([
            generateInlineButtonSegue({
                text: 'Редактировать заявку',
                action: SceneCallbackAction.segueButton,
                data: {
                    segueSceneName: 'moderationEditing',
                },
            }),
        ])
        await ctx.telegram.sendMessage(
            admin.telegramId,
            `Вы перевели завяку <b>${publication.id}</b> в режим ручного редактирования. Что приступить, нажмите на кнопку ниже`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: inlineKeyboard,
                },
            }
        )
        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePlacePublication(publication: PublicationDocument, ctx: Context<Update>) {
        if (publication.status == 'rejected' || publication.status == 'notRelevant') {
            await this.sendMessageToCurrentThread(
                ctx,
                'Нельзя опубликовать заявки, имеющие статус Отклонённая или Не актуально'
            )
            return
        }
        const message = ctx.message as Message.TextMessage
        const channelIdList = message.text.split(' ').slice(1)
        if (channelIdList.isEmpty) {
            await this.sendMessageToCurrentThread(
                ctx,
                'Не удалось распознать id канала для публикации'
            )
            return
        }

        // Create main channel publication
        const inlineKeyboardMainPublication: InlineKeyboardButton[][] = []

        // Try to find media
        const mediaGroupArgs: MediaGroup = publication.answers
            .compactMap((answer) => {
                return answer.question.addAnswerToTelegramPublication &&
                    SurveyUsageHelpers.isPassedAnswerMediaType(answer)
                    ? answer.media
                    : null
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
        const publicationText = SurveyFormatter.publicationPublicText(
            publication,
            botContent.uniqueMessage
        )

        for (const channelId of channelIdList) {
            try {
                if (mediaGroupArgs.length > 0) {
                    mediaGroupArgs[0]['caption'] = publicationText
                    const mainChannelMessages = await ctx.telegram.sendMediaGroup(
                        channelId,
                        mediaGroupArgs
                    )
                    // When telegram sends media group, every media will became separete message
                    // And only one of them will have a caption, witch will be a message text
                    // We should save id of them to edit message in future
                    const mainChannelPostRaw = mainChannelMessages.find(
                        (message) => message.caption
                    )
                    if (!mainChannelPostRaw) {
                        logger.error('Cannot find mainChannelPostRaw')
                        return
                    }
                    mainChannelPost = mainChannelPostRaw
                } else {
                    mainChannelPost = await ctx.telegram.sendMessage(channelId, publicationText, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: inlineKeyboardMainPublication,
                        },
                    })
                }
                publication.placementHistory.push({
                    type: 'telegram',
                    channelId: mainChannelPost.chat.id,
                    creationDate: new Date(),
                    messageId: mainChannelPost.message_id,
                })
            } catch {
                await this.sendMessageToCurrentThread(
                    ctx,
                    `Не удалось отправить сообщение в чат ${channelId}`
                )
            }
        }

        await this.moderatedPublicationService.updatePublication(publication._id.toString(), {
            placementHistory: publication.placementHistory,
        })
    }

    private async handlePublicationApprove(
        publicationRaw: PublicationDocument,
        ctx: Context<Update>
    ) {
        if (publicationRaw.status != 'moderation') {
            await this.sendMessageToCurrentThread(
                ctx,
                'Обобрить объявление можно только если заявка находится на рассмотрении'
            )
            return
        }

        const publicationId = publicationRaw._id.toString()
        await this.moderatedPublicationService.updatePublicationStatus(publicationId, 'active')

        // Notify admin
        await this.sendSuccessMessageToCurrentThread(ctx)
    }

    private async handlePublicationReject(publication: PublicationDocument, ctx: Context<Update>) {
        if (publication.status != 'moderation' || publication.placementHistory) {
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
        if (publication.status != 'active') {
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

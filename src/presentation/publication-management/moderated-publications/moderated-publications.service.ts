import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { MediaGroup } from 'node_modules/telegraf/typings/telegram-types'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { SurveyUsageHelpers } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { PublicationCreateDto } from 'src/business-logic/publication-storage/dto/publication.dto'
import { PublicationStatus } from 'src/business-logic/publication-storage/enums/publication-status.enum'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { sleep } from 'src/utils/sleep'
import { SurveyFormatter } from 'src/utils/survey-formatter'
import { Markup, Telegraf } from 'telegraf'
import { InlineKeyboardButton, Message } from 'telegraf/types'

@Injectable()
export class ModeratedPublicationsService {
    constructor(
        private readonly userService: UserService,
        private readonly botContentService: BotContentService,
        private readonly publicationStorageService: PublicationStorageService,
        @InjectBot() private readonly bot: Telegraf
    ) {}

    // =====================
    // Public methods
    // =====================

    async createPublicationAndSendToModeration(
        createDto: PublicationCreateDto
    ): Promise<PublicationDocument> {
        const botContent = await this.botContentService.getContent(createDto.language)
        createDto.status = 'created'
        const publication = await this.publicationStorageService.create(createDto)

        const moderationChannelId = internalConstants.moderationChannelId
        const answersText = SurveyFormatter.moderationPreSynchronizedText(publication, botContent)
        const moderationChannelMessage = await this.bot.telegram.sendMessage(
            moderationChannelId,
            answersText,
            {
                parse_mode: 'HTML',
            }
        )
        await this.publicationStorageService.update(publication._id.toString(), {
            moderationChannelPublicationId: moderationChannelMessage.message_id,
        })

        return publication
    }

    async syncronizeModerationMessage(message: Message.TextMessage) {
        const messageText = message.text
        if (
            !messageText ||
            !messageText.startsWith(internalConstants.loadingServiceChatMessagePrefix) ||
            message.from?.first_name != 'Telegram'
        ) {
            throw Error(`Unsupported telegram service message format`)
        }

        const publicationId = messageText.split('\n')[1]?.split(':')[1]?.trimmed
        if (!publicationId) throw Error(`Cannot parse publication Id`)

        let publication = await this.publicationStorageService.findById(publicationId)
        if (!publication) throw Error(`Cannot find publication with id ${publicationId}`)

        publication = await this.publicationStorageService.update(publicationId, {
            moderationChatThreadMessageId: message.message_id,
        })

        /** =====================
         *
         * This bunch of code need to synchonize concurrent telegram messages receive evevnts
         * method createPublicationAndSendToModeration
         * 1. Scene pushes publication to database ()
         * 2. Scene sends message to moderation chat
         * - This dispatcher can handle service message before scene receive the sended message object
         * So we will wait for scene to set moderationChannelPublicationId
         *
         * Maybe we will refactor this later
         */
        let timeoutCount = 0
        const timeoutMaxCount = 10
        while (!publication?.moderationChannelPublicationId) {
            if (timeoutCount >= timeoutMaxCount) {
                throw Error(
                    `Cannot find publication.moderationChannelPublicationId with id${publicationId}`
                )
            }
            logger.log(
                `Timeout cause cannot find publication.moderationChannelPublicationId whith id ${publicationId}`
            )
            await sleep(3)
            publication = await this.publicationStorageService.findById(publicationId)
            timeoutCount++
        }
        /**
        ===================== */

        const user = await this.userService.findOneByTelegramId(publication.userTelegramId)
        if (!user) throw Error(`Cannot find user with id ${publication.userTelegramId}`)

        const language = internalConstants.defaultLanguage
        const botContent = await this.botContentService.getContent(language)
        const editedText = SurveyFormatter.moderationSynchronizedText(
            publication,
            botContent.uniqueMessage,
            user
        )
        await this.bot.telegram.editMessageText(
            internalConstants.moderationChannelId,
            publication.moderationChannelPublicationId,
            undefined,
            editedText,
            {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
            }
        )
        await this.sendPublicationsMediaToModerationThread(publication)

        let moderationCommandsText = `Актуальные на данный момент комманды:\n`
        moderationCommandsText += Object.values(botContent.uniqueMessage.moderationCommand)
            .map((command) => `- ${command}`)
            .join('\n')

        await this.bot.telegram.sendMessage(message.chat.id, moderationCommandsText, {
            reply_parameters: { message_id: message.message_id },
            parse_mode: 'HTML',
        })

        await this.updatePublicationStatus(publicationId, 'moderation')

        return
    }

    async updatePublication(
        publicationDocumentId: string,
        updateDto: Partial<PublicationDocument>
    ) {
        const publicationDocument = await this.publicationStorageService.update(
            publicationDocumentId,
            updateDto
        )
        if (!publicationDocument)
            throw Error(
                `Fail to update publication status: publication with id '${publicationDocumentId}' does not exists`
            )

        const botContent = await this.botContentService.getContent(publicationDocument.language)
        const text = botContent.uniqueMessage

        // Update status in moderation channel
        // TODO: Добавить ссылки на публикации в канале модераторов
        if (publicationDocument.moderationChannelPublicationId) {
            try {
                const user = await this.userService.findOneByTelegramId(
                    publicationDocument.userTelegramId
                )
                if (!internalConstants.moderationChannelId || !user) return
                await this.bot.telegram.editMessageText(
                    internalConstants.moderationChannelId,
                    publicationDocument.moderationChannelPublicationId,
                    undefined,
                    SurveyFormatter.moderationSynchronizedText(publicationDocument, text, user),
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true },
                    }
                )
            } catch (error) {
                logger.error(
                    `Fail to update publication status in moderation channel \nPublication id: '${publicationDocumentId}'`,
                    error
                )
            }
        }

        // Update status in main channel
        const inlineKeyboardMainPublication: InlineKeyboardButton[][] = []
        if (publicationDocument.placementHistory) {
            const publicationContainsMedia = publicationDocument.answers.some(
                (answer) =>
                    SurveyUsageHelpers.isMediaType(answer.type) &&
                    'media' in answer &&
                    answer.media.isNotEmpty
            )
            for (const placement of publicationDocument.placementHistory) {
                if (publicationContainsMedia) {
                    try {
                        await this.bot.telegram.editMessageCaption(
                            placement.channelId,
                            placement.messageId,
                            undefined,
                            SurveyFormatter.publicationPublicText(publicationDocument, text),
                            {
                                parse_mode: 'HTML',
                                reply_markup: {
                                    inline_keyboard: inlineKeyboardMainPublication,
                                },
                            }
                        )
                    } catch (error) {
                        logger.error(
                            `Fail to update publication status in main channel \nPublication id: '${publicationDocumentId}'`
                        )
                    }
                } else {
                    try {
                        if (!internalConstants.publicationMainChannelId) return
                        await this.bot.telegram.editMessageText(
                            placement.channelId,
                            placement.messageId,
                            undefined,
                            SurveyFormatter.publicationPublicText(publicationDocument, text),
                            {
                                parse_mode: 'HTML',
                                link_preview_options: { is_disabled: true },
                                reply_markup: {
                                    inline_keyboard: inlineKeyboardMainPublication,
                                },
                            }
                        )
                    } catch (error) {
                        logger.error(
                            `Fail to update publication status in main channel \nPublication id: '${publicationDocumentId}'`
                        )
                    }
                }
            }
        }
    }

    async updatePublicationStatus(publicationDocumentId: string, status: PublicationStatus.Union) {
        await this.updatePublication(publicationDocumentId, {
            status: status,
        })
        const publicationDocument = await this.publicationStorageService.findById(
            publicationDocumentId
        )
        if (!publicationDocument)
            throw Error(
                `Fail to update publication status: publication with id '${publicationDocumentId}' does not exists`
            )

        const botContent = await this.botContentService.getContent(publicationDocument.language)
        const text = botContent.uniqueMessage

        // Notify user
        let textForUser = ''
        switch (status) {
            case 'created':
                return

            case 'moderation':
                textForUser = text.moderation.messageTextModeration
                break

            case 'rejected':
                textForUser = text.moderation.messageTextRejected
                break

            case 'active':
                textForUser = text.moderation.messageTextAccepted
                break

            case 'notRelevant':
                textForUser = text.moderation.messageTextNotRelevant
                break
        }
        const moderationMessageText = SurveyFormatter.makeUserMessageWithPublicationInfo(
            textForUser,
            publicationDocument,
            text
        )
        await this.bot.telegram.sendMessage(
            publicationDocument.userTelegramId,
            moderationMessageText,
            {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
            }
        )
    }

    // =====================
    // Private methods
    // =====================

    private async sendPublicationsMediaToModerationThread(publication: PublicationDocument) {
        const moderationChatId = internalConstants.moderationChatId
        const threadMessageId = publication.moderationChatThreadMessageId

        if (!threadMessageId) {
            throw Error(`Publication with id '${publication._id}' was not syncronize`)
        }

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

                await this.bot.telegram.sendMediaGroup(moderationChatId, mediaGroupArgs, {
                    reply_parameters: { message_id: threadMessageId },
                })
            }
        }
    }
}

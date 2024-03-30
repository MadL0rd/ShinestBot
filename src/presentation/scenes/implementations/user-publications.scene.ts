import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import {
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
} from 'telegraf/types'
import { SceneCallbackAction, SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { SurveyFormatter } from 'src/utils/survey-formatter'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'

// =====================
// Scene data classes
// =====================
export class UserPublicationsSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'userPublications'
}
type SceneEnterDataType = UserPublicationsSceneEntranceDto
interface ISceneData {}

type CallbackDataType = {
    /** publication id */
    i: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class UserPublicationsScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'userPublications'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly publicationStorageService: PublicationStorageService,
        private readonly moderatedPublicationService: ModeratedPublicationsService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(
        ctx: Context,
        data?: SceneEnterDataType
    ): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory(this.historyEvent.startSceneUserPublications)

        await this.displayUserPublications(ctx)
        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})

        switch (message.text) {
            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })
            case this.text.common.buttonBackToPreviousMenu:
                return await this.handleEnterScene(ctx)
        }
        return this.completion.canNotHandle({})
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        if (data.action != SceneCallbackAction.publicationSetStatusNotRelevant) {
            return this.completion.canNotHandle({})
        }
        const inlineButtonData = data.data as CallbackDataType
        if (!inlineButtonData.i) {
            return this.completion.canNotHandle({})
        }
        const publicationId = inlineButtonData.i
        const publicationDocument = await this.publicationStorageService.findById(publicationId)
        if (
            !publicationDocument ||
            this.user.telegramId != publicationDocument.userTelegramId ||
            (publicationDocument.status != 'active' && publicationDocument.status != 'moderation')
        ) {
            return this.completion.canNotHandle({})
        }
        await this.moderatedPublicationService.updatePublicationStatus(
            publicationDocument._id.toString(),
            'notRelevant'
        )
        const messageId = ctx.callbackQuery.message?.message_id
        const chatId = ctx.callbackQuery.message?.chat.id
        if (messageId && chatId) {
            await ctx.telegram.editMessageReplyMarkup(chatId, messageId, undefined, undefined)
        }

        return this.completion.complete()
    }

    // =====================
    // Private methods
    // =====================
    private async displayUserPublications(ctx: Context<Update>) {
        const publications: PublicationDocument[] = []

        for (const id of this.user.internalInfo.publications) {
            const publicationDocument = await this.publicationStorageService.findById(id)
            if (publicationDocument) {
                publications.push(publicationDocument)
            }
        }

        if (publications.length == 0) {
            await ctx.replyWithHTML(this.text.userPublications.textEmpty, this.getDefaultKeyboard())
        }

        await ctx.replyWithHTML(this.text.userPublications.text, {
            link_preview_options: { is_disabled: true },
            reply_markup: this.getDefaultKeyboard().reply_markup,
        })

        for (const publication of publications) {
            const inlineKeyboard: InlineKeyboardButton[][] = []
            const publicationText = this.generateAdvertInfoText(publication)

            if (publication.status == 'active' || publication.status == 'moderation') {
                const callbackData: CallbackDataType = { i: publication._id.toString() }
                inlineKeyboard.push([
                    generateInlineButton(
                        {
                            text: this.text.userPublications.buttonSetStatusNotRelevant,
                            action: SceneCallbackAction.publicationSetStatusNotRelevant,
                            data: callbackData,
                        },
                        'userPublications'
                    ),
                ])
            }
            const tgLink = SurveyFormatter.publicationTelegramLink(publication)
            if (tgLink) {
                inlineKeyboard.push([
                    Markup.button.url(this.text.userPublications.buttonLinkTelegram, tgLink),
                ])
            }

            await ctx.replyWithHTML(publicationText, {
                link_preview_options: { is_disabled: true },
                reply_markup: {
                    inline_keyboard: inlineKeyboard,
                },
            })
        }
    }

    private generateAdvertInfoText(publication: PublicationDocument): string {
        return `\n\n${SurveyFormatter.makeUserMessageWithPublicationInfo(
            this.text.userPublications.advertInfoFormat,
            publication,
            this.text
        )}`
    }

    private getDefaultKeyboard(): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        return super.keyboardMarkupWithAutoLayoutFor([this.text.common.buttonReturnToMainMenu])
    }
}

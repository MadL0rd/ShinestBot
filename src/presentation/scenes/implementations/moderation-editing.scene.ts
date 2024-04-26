import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'

// =====================
// Scene data classes
// =====================
export class ModerationEditingSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'moderationEditing'
}
type SceneEnterDataType = ModerationEditingSceneEntranceDto
interface ISceneData {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class ModerationEditingScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'moderationEditing'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly publicationStorageService: PublicationStorageService,
        private readonly contextProviderFactory: SurveyContextProviderFactoryService
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
        await this.logToUserHistory({ type: 'startSceneModerationEditing' })

        const publicationId = this.user.internalInfo.adminsOnly?.modifyingPublicationIdPrepared

        if (!publicationId) {
            await ctx.replyWithHTML(this.text.moderationEditing.textEmpty)
            return this.completion.complete()
        }

        const publication = await this.publicationStorageService.findById(publicationId)
        if (!publication) {
            await ctx.replyWithHTML(`Не удалось найти заявку с id ${publicationId}`)
            return this.handleEnterScene(ctx)
        }

        this.user.internalInfo.adminsOnly.modifyingPublicationIdCurrent = publicationId
        const messageText = this.text.moderationEditing.text.replaceAll(
            this.text.moderation.messagePostIdPlaceholder,
            publicationId
        )
        await ctx.replyWithHTML(
            messageText,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.moderationEditing.buttonStartEditing,
                this.text.common.buttonReturnToMainMenu,
            ])
        )
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
                return this.completion.complete()

            case this.text.moderationEditing.buttonStartEditing:
                const publicationId =
                    this.user.internalInfo.adminsOnly.modifyingPublicationIdPrepared
                if (!publicationId) {
                    return this.completion.complete()
                }
                const publication = await this.publicationStorageService.findById(publicationId)
                if (!publication) {
                    await ctx.replyWithHTML(`Не удалось найти заявку с id ${publicationId}`)
                    return this.handleEnterScene(ctx)
                }
                this.user.internalInfo.adminsOnly.modifyingPublicationIdCurrent = publicationId
                await this.userService.update(this.user)

                const contextService =
                    this.contextProviderFactory.getSurveyContextProvider('moderationEditing')
                await contextService.setAnswersCache(this.user, {
                    contentLanguage: publication.language,
                    passedAnswers: publication.answers,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: 'moderationEditing',
                    allowContinueQuestion: false,
                })

            default:
                return this.completion.canNotHandle({})
        }
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
}

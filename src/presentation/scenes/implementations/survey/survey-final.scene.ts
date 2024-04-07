import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { SurveyFormatter } from 'src/utils/survey-formatter'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'

// =====================
// Scene data classes
// =====================
export class SurveyFinalSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyFinal'
    readonly providerType: SurveyContextProviderType.Union
}
type SceneEnterDataType = SurveyFinalSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyFinalScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyFinal'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyContextProviderFactoryService,
        private readonly publicationStorageService: PublicationStorageService,
        private readonly botContentService: BotContentService
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
        await this.logToUserHistory({ type: 'startSceneSurveyFinal' })

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
        const cache = await provider.getAnswersCacheStable(this.user)

        const answersText = SurveyFormatter.generateTextFromPassedAnswers(cache, this.content)

        await ctx.replyWithHTML(answersText)
        await ctx.replyWithHTML(
            this.text.surveyFinal.text,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyFinal.buttonDone,
                this.text.common.buttonReturnToMainMenu,
            ])
        )

        return this.completion.inProgress({
            providerType: data.providerType,
        })
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (!message || !('text' in message))
            return this.completion.canNotHandle({ providerType: data.providerType })

        switch (message.text) {
            case this.text.surveyFinal.buttonDone:
                const nextSceneDto = await provider.completeSurveyAndGetNextScene(this.user)
                return this.completion.complete(nextSceneDto)

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })
        }

        const cache = await provider.getAnswersCacheStable(this.user)
        const questionIndex = parseInt(message.text)
        if (
            questionIndex &&
            !Number.isNaN(questionIndex) &&
            questionIndex <= cache.passedAnswers.length &&
            questionIndex >= 1
        ) {
            cache.passedAnswers.splice(questionIndex - 1, 1)
            await provider.setAnswersCache(this.user, cache)
            return this.completion.complete({
                sceneName: 'survey',
                providerType: data.providerType,
                allowContinueQuestion: false,
            })
        }

        return this.completion.canNotHandle({ providerType: data.providerType })
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

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
import { SurveyDataProviderType } from 'src/presentation/survey-data-provider/models/survey-data-provider.interface'
import { SurveyDataProviderFactoryService } from 'src/presentation/survey-data-provider/survey-provider-factory/survey-provider-factory.service'
import { SurveyUsageHelpers } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'

// =====================
// Scene data classes
// =====================
export class SurveySceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'survey'
    readonly provider: SurveyDataProviderType
    readonly allowContinueQuestion: boolean
}
type SceneEnterDataType = SurveySceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'survey'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyDataProviderFactoryService
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
        await this.logToUserHistory(this.historyEvent.startSceneSurvey, data?.provider)
        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        const provider = this.dataProviderFactory.getSurveyProvider(data.provider)
        const cache = await provider.getAnswersCache(this.content, this.user)
        if (data.allowContinueQuestion && cache.passedAnswers.isNotEmpty) {
            return this.completion.complete({
                sceneName: 'surveyContinue',
                provider: data.provider,
            })
        }

        const survaySource = await provider.getSurvey(this.content)
        const nextQuestion = SurveyUsageHelpers.findNextQuestion(survaySource, cache.passedAnswers)
        if (!nextQuestion) {
            return this.completion.complete({
                sceneName: 'surveyFinal',
                provider: data.provider,
            })
        }

        const isQuestionFirst = cache.passedAnswers.isEmpty
        switch (nextQuestion.type) {
            case 'options':
                return this.completion.complete({
                    sceneName: 'surveyQuestionOptions',
                    provider: data.provider,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'numeric':
            case 'string':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringNumeric',
                    provider: data.provider,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'image':
                return this.completion.complete()
            case 'video':
                return this.completion.complete()
            case 'mediaGroup':
                return this.completion.complete()
        }
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        return this.completion.complete()
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

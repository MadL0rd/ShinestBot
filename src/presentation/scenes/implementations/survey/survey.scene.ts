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
import { SurveyUsageHelpers } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'

// =====================
// Scene data classes
// =====================
export class SurveySceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'survey'
    readonly providerType: SurveyContextProviderType.Union
    readonly allowContinueQuestion: boolean
}
type SceneEnterDataType = SurveySceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'survey'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyContextProviderFactoryService
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
        await this.logToUserHistory({ type: 'startSceneSurvey', surveyType: data?.providerType })
        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const validationResult = await provider.validateUserCanStartSurvey(this.user)
        if (validationResult.canStartSurvey == false) {
            if (validationResult.message) {
                await ctx.replyWithHTML(validationResult.message)
            }
            return this.completion.complete(validationResult.nextScene)
        }

        const cache = await provider.getAnswersCache(this.user)
        if (data.allowContinueQuestion && cache.passedAnswers.isNotEmpty) {
            return this.completion.complete({
                sceneName: 'surveyContinue',
                providerType: data.providerType,
            })
        }

        const surveySource = await provider.getSurvey(this.user)
        const nextQuestion = SurveyUsageHelpers.findNextQuestion(surveySource, cache.passedAnswers)
        if (!nextQuestion) {
            return this.completion.complete({
                sceneName: 'surveyFinal',
                providerType: data.providerType,
            })
        }

        const isQuestionFirst = cache.passedAnswers.isEmpty
        switch (nextQuestion.type) {
            case 'options':
                return this.completion.complete({
                    sceneName: 'surveyQuestionOptions',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'numeric':
            case 'string':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringNumeric',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'image':
            case 'video':
            case 'mediaGroup':
                return this.completion.complete({
                    sceneName: 'surveyQuestionMedia',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
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

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
import { Survey } from 'src/entities/survey'

// =====================
// Scene data classes
// =====================
export class SurveySceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'survey'
    readonly providerType: SurveyContextProviderType.Union
    readonly allowContinueQuestion: boolean
    readonly popAnswerOnStart?:
        | { type: 'popLastAnswer' }
        | { type: 'beforeQuestionWithId'; questionId: string }
        | { type: 'byQuestionIndex'; questionIndex: number }
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

        let previousAnswer: Survey.PassedAnswer | undefined
        if (data.popAnswerOnStart) {
            switch (data.popAnswerOnStart.type) {
                case 'popLastAnswer':
                    previousAnswer = await provider.popAnswerFromCache(this.user)
                    break
                case 'beforeQuestionWithId':
                    previousAnswer = await provider.popAnswerFromCache(
                        this.user,
                        data.popAnswerOnStart.questionId
                    )
                    break
                case 'byQuestionIndex':
                    previousAnswer = cache.passedAnswers[data.popAnswerOnStart.questionIndex]
                    cache.passedAnswers.splice(data.popAnswerOnStart.questionIndex, 1)
                    await provider.setAnswersCache(this.user, cache)
                    break
            }
        }

        if (data.allowContinueQuestion && cache.passedAnswers.isNotEmpty) {
            return this.completion.complete({
                sceneName: 'surveyContinue',
                providerType: data.providerType,
            })
        }

        const surveySource = await provider.getSurvey(this.user)
        const nextQuestion = Survey.Helper.findNextQuestion(surveySource, cache.passedAnswers)
        if (!nextQuestion) {
            return this.completion.complete({
                sceneName: 'surveyFinal',
                providerType: data.providerType,
            })
        }

        let mediaGroupBufferCache: Survey.TelegramFileData[] = []
        let multipleChoiceBufferCache: string[] = []
        if (previousAnswer && nextQuestion.id == previousAnswer.question.id) {
            switch (previousAnswer.type) {
                case 'string':
                case 'options':
                case 'numeric':
                case 'stringGptTips':
                    break
                case 'multipleChoice':
                    multipleChoiceBufferCache = previousAnswer.selectedOptionsIds
                    break
                case 'image':
                case 'video':
                case 'mediaGroup':
                    mediaGroupBufferCache = previousAnswer.media
            }
        }

        const isQuestionFirst = cache.passedAnswers.isEmpty
        await this.logToUserHistory({
            type: 'surveyQuestionStartAnswering',
            questionId: nextQuestion.id,
        })
        switch (nextQuestion.type) {
            case 'options':
                return this.completion.complete({
                    sceneName: 'surveyQuestionOptions',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'multipleChoice':
                return this.completion.complete({
                    sceneName: 'surveyQuestionMultipleChoice',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                    selectedOptionsIdsList: multipleChoiceBufferCache,
                })
            case 'numeric':
            case 'string':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringNumeric',
                    providerType: data.providerType,
                    question: nextQuestion,
                    isQuestionFirst: isQuestionFirst,
                })
            case 'stringGptTips':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringGptTips',
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
                    mediaGroupBuffer: mediaGroupBufferCache,
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

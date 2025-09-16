import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveySceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'survey'
    readonly providerType: SurveyContextProviderType.Union
    readonly allowContinueQuestion: boolean
    readonly allowBackToPreviousQuestion?: boolean
    readonly popAnswerOnStart?:
        | { type: 'popLastAnswer' }
        | { type: 'beforeQuestionWithId'; questionId: string }
        | { type: 'byQuestionIndex'; questionIndex: number }
}
type SceneEnterData = SurveySceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'survey'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly dataProviderFactory: SurveyContextProviderFactoryService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const validationResult = await provider.validateUserCanStartSurvey(this.user)
        if (validationResult.canStartSurvey === false) {
            if (validationResult.message) {
                await this.ddi.sendHtml(validationResult.message)
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
        const nextQuestion = await provider.getNextQuestion(this.user)
        if (!nextQuestion) {
            return this.completion.complete({
                sceneName: 'surveyFinal',
                providerType: data.providerType,
            })
        }

        let mediaGroupBufferCache: Survey.TelegramFileData[] = []
        let multipleChoiceBufferCache: string[] = []
        if (previousAnswer && nextQuestion.id === previousAnswer.question.id) {
            switch (previousAnswer.type) {
                case 'string':
                case 'options':
                case 'optionsInline':
                case 'numeric':
                case 'stringGptTips':
                case 'phoneNumber':
                    break
                case 'multipleChoice':
                    multipleChoiceBufferCache = previousAnswer.selectedOptionsIds
                    break
                case 'image':
                case 'singleImage':
                case 'video':
                case 'mediaGroup':
                    mediaGroupBufferCache = previousAnswer.media
            }
        }

        const isQuestionFirst =
            cache.passedAnswers.isEmpty || surveySource.questions.first?.id === nextQuestion.id
        const allowBackToPreviousQuestion =
            data.allowBackToPreviousQuestion === false ? false : !isQuestionFirst
        this.logToUserHistory({
            type: 'surveyQuestionWasShown',
            providerType: 'registration',
            questionId: nextQuestion.id,
        })
        switch (nextQuestion.type) {
            case 'options':
                return this.completion.complete({
                    sceneName: 'surveyQuestionOptions',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                })

            case 'optionsInline':
                return this.completion.complete({
                    sceneName: 'surveyQuestionOptionsInline',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                })

            case 'multipleChoice':
                return this.completion.complete({
                    sceneName: 'surveyQuestionMultipleChoice',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                    selectedOptionsIdsList: multipleChoiceBufferCache,
                })

            case 'numeric':
            case 'string':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringNumeric',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                })

            case 'stringGptTips':
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringGptTips',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                })

            case 'image':
            case 'video':
            case 'mediaGroup':
                return this.completion.complete({
                    sceneName: 'surveyQuestionMedia',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                    mediaGroupBuffer: mediaGroupBufferCache,
                })

            case 'singleImage':
                return this.completion.complete({
                    sceneName: 'surveyQuestionSingleImage',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                    mediaGroupBuffer: mediaGroupBufferCache,
                })

            case 'phoneNumber':
                return this.completion.complete({
                    sceneName: 'surveyQuestionPhoneNumber',
                    providerType: data.providerType,
                    question: nextQuestion,
                    allowBackToPreviousQuestion: allowBackToPreviousQuestion,
                })
        }
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        logger.error('User flow error. Redirect to main menu')
        return this.completion.complete()
    }

    // =====================
    // Private methods
    // =====================
}

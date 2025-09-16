import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../../models/scene-entrance.interface'
import { SceneName } from '../../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../../models/scene-usage-permissions-validator'
import { Scene } from '../../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../../models/scene.interface'
import { InjectableSceneConstructor } from '../../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export interface SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto
    extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionStringGptTipsAnswerEditing'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
    currentAnswer: string
}
type SceneEnterData = SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
    currentAnswer: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringGptTipsAnswerEditingScene extends Scene<
    SceneData,
    SceneEnterData
> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionStringGptTipsAnswerEditing'
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

        await this.ddi.sendHtml(data.question.questionText)
        await this.ddi.sendHtml(
            this.text.surveyQuestionGptTip.textAnswerEditing,
            super.keyboardMarkupWithAutoLayoutFor(
                [
                    this.text.surveyQuestionGptTip.buttonAnswerEditingDone,
                    this.text.surveyQuestionGptTip.buttonAnswerEditingUpdateWithGpt,
                    this.text.surveyQuestionGptTip.buttonAnswerEditingRestart,
                    data.question.isRequired ? null : this.text.survey.buttonOptionalQuestionSkip,
                    data.allowBackToPreviousQuestion
                        ? this.text.survey.buttonBackToPreviousQuestion
                        : null,
                ].compact
            )
        )
        await this.ddi.sendHtml(data.currentAnswer)

        return this.completion.inProgress(data)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType || !data.question || !data.currentAnswer) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        switch (message.text) {
            case this.text.survey.buttonOptionalQuestionSkip:
                if (data.question.isRequired) break
                await provider.pushAnswerToCache(
                    this.user,
                    Survey.Helper.getEmptyAnswerForQuestion(data.question)
                )
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })

            case this.text.survey.buttonBackToPreviousQuestion:
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                    popAnswerOnStart: {
                        type: 'beforeQuestionWithId',
                        questionId: data.question.id,
                    },
                })

            case this.text.surveyQuestionGptTip.buttonAnswerEditingDone:
                await provider.pushAnswerToCache(this.user, {
                    type: 'stringGptTips',
                    question: data.question,
                    selectedString: data.currentAnswer,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })

            case this.text.surveyQuestionGptTip.buttonAnswerEditingUpdateWithGpt:
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringGptTipsUpdateWithGpt',
                    providerType: data.providerType,
                    question: data.question,
                    allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
                    currentAnswer: data.currentAnswer,
                })

            case this.text.surveyQuestionGptTip.buttonAnswerEditingRestart:
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })

            default:
                break
        }

        return this.completion.complete()
    }

    // =====================
    // Private methods
    // =====================
}

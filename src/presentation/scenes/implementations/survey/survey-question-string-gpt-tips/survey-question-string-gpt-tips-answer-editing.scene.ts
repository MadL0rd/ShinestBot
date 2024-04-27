import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../../../models/scene-callback'
import { SceneEntrance } from '../../../models/scene-entrance.interface'
import { SceneName } from '../../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../../models/scene.interface'
import { Scene } from '../../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../../scene-factory/scene-injections-provider.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionStringGptTipsAnswerEditing'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly isQuestionFirst: boolean
    currentAnswer: string
}
type SceneEnterDataType = SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly isQuestionFirst: boolean
    currentAnswer: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringGptTipsAnswerEditingScene extends Scene<
    ISceneData,
    SceneEnterDataType
> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionStringGptTipsAnswerEditing'
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
        await this.logToUserHistory({ type: 'startSceneSurveyQuestionStringGptTipsAnswerEditing' })

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(data.question.questionText)
        await ctx.replyWithHTML(
            this.text.surveyQuestionGptTip.textAnswerEditing,
            super.keyboardMarkupWithAutoLayoutFor(
                [
                    this.text.surveyQuestionGptTip.buttonAnswerEditingDone,
                    this.text.surveyQuestionGptTip.buttonAnswerEditingUpdateWithGpt,
                    this.text.surveyQuestionGptTip.buttonAnswerEditingRestart,
                    data.question.isRequired ? null : this.text.survey.buttonOptionalQuestionSkip,
                    data.isQuestionFirst ? null : this.text.survey.buttonBackToPreviousQuestion,
                ].compact
            )
        )
        await ctx.replyWithHTML(data.currentAnswer)

        return this.completion.inProgress(data)
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType || !data.question || !data.currentAnswer) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

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
                    isQuestionFirst: data.isQuestionFirst,
                    currentAnswer: data.currentAnswer,
                })

            case this.text.surveyQuestionGptTip.buttonAnswerEditingRestart:
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })
        }

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

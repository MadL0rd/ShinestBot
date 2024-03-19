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
import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { SurveyDataProviderFactoryService } from 'src/presentation/survey-data-provider/survey-provider-factory/survey-provider-factory.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionOptionsSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionOptions'
    readonly provider: SurveyDataProviderType
    readonly question: Survey.QuestionWithOptions
    readonly isQuestionFirst: boolean
}
type SceneEnterDataType = SurveyQuestionOptionsSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType
    readonly question: Survey.QuestionWithOptions
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionOptionsScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'surveyQuestionOptions'
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
        await this.logToUserHistory(this.historyEvent.startSceneSurveyQuestionOptions)

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(
            data.question.questionText,
            super.keyboardMarkupWithAutoLayoutFor(
                [
                    ...data.question.options.map((option) => option.text),
                    data.question.isRequired ? null : this.text.survey.buttonOptionalQuestionSkip,
                    data.isQuestionFirst ? null : this.text.survey.buttonBackToPreviousQuestion,
                ].compact
            )
        )

        return this.completion.inProgress(data)
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data = this.restoreData(dataRaw)
        if (!data || !data.provider || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyProvider(data.provider)

        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

        switch (message.text) {
            case this.text.survey.buttonOptionalQuestionSkip:
                if (data.question.isRequired) break
                await provider.pushAnswerToCache(this.user, {
                    type: 'options',
                    question: data.question,
                    selectedOptionId: undefined,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })

            case this.text.survey.buttonBackToPreviousQuestion:
                await provider.popAnswerFromCache(this.user)
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
        }

        const selectedOption = data.question.options.find((option) => option.text == message.text)
        if (!selectedOption) return this.completion.canNotHandle(data)

        await provider.pushAnswerToCache(this.user, {
            type: 'options',
            question: data.question,
            selectedOptionId: selectedOption.id,
        })
        return this.completion.complete({
            sceneName: 'survey',
            provider: data.provider,
            allowContinueQuestion: false,
        })
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

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
import { removeKeyboard } from 'telegraf/markup'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionStringNumericSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionStringNumeric'
    readonly provider: SurveyDataProviderType
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
    readonly isQuestionFirst: boolean
}
type SceneEnterDataType = SurveyQuestionStringNumericSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringNumericScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'surveyQuestionStringNumeric'
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
        await this.logToUserHistory(this.historyEvent.startSceneSurveyQuestionStringNumeric)

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        let questionText = `${data.question.questionText}\n`
        if (!data.question.isRequired) {
            questionText += `${this.text.survey.textPrefixComandSkipQuestion} ${this.text.survey.comandSkipQuestion}`
        }

        await ctx.replyWithHTML(questionText, removeKeyboard())

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
            case this.text.survey.comandBackToPreviousQuestion:
                await provider.popAnswerFromCache(this.user)
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
            case this.text.survey.comandSkipQuestion:
                if (data.question.isRequired) break
                let answer: Survey.PassedAnswerString | Survey.PassedAnswerNumeric
                switch (data.question.type) {
                    case 'numeric':
                        answer = {
                            type: 'numeric',
                            question: data.question,
                            selectedNumber: undefined,
                        }
                        break
                    case 'string':
                        answer = {
                            type: 'string',
                            question: data.question,
                            selectedString: undefined,
                        }
                        break
                }
                await provider.pushAnswerToCache(this.user, answer)
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
        }
        switch (data.question.type) {
            case 'numeric':
                const convertedAnswer = parseFloat(
                    message.text.replaceAll(',', '.').trim().replaceAll(' ', '')
                )
                if (Number.isNaN(convertedAnswer)) {
                    await ctx.replyWithHTML(this.text.survey.errorMessageAnswerIsNotNumber)
                    return this.completion.inProgress(data)
                }
                await provider.pushAnswerToCache(this.user, {
                    type: 'numeric',
                    question: data.question,
                    selectedNumber: convertedAnswer,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
            case 'string':
                await provider.pushAnswerToCache(this.user, {
                    type: 'string',
                    question: data.question,
                    selectedString: message.text,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
        }
        return this.completion.canNotHandle(data)
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

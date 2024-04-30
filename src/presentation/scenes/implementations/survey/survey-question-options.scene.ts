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
export class SurveyQuestionOptionsSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionOptions'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithOptions
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterDataType = SurveyQuestionOptionsSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
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

    readonly name: SceneName.Union = 'surveyQuestionOptions'
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
        await this.logToUserHistory({ type: 'startSceneSurveyQuestionOptions' })

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
                    data.allowBackToPreviousQuestion
                        ? this.text.survey.buttonBackToPreviousQuestion
                        : null,
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
        if (!data || !data.providerType || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

        switch (message.text) {
            case this.text.survey.buttonOptionalQuestionSkip:
                if (data.question.isRequired) break
                await provider.pushAnswerToCache(this.user, {
                    type: 'options',
                    question: data.question,
                    selectedOptionId: null,
                })
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
            providerType: data.providerType,
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

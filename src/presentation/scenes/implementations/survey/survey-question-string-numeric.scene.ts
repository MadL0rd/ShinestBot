import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackAction, SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import { SurveyDataProviderType } from 'src/presentation/survey-data-provider/models/survey-data-provider.interface'
import {
    Survey,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { SurveyDataProviderFactoryService } from 'src/presentation/survey-data-provider/survey-provider-factory/survey-provider-factory.service'
import { removeKeyboard } from 'telegraf/markup'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionStringNumericSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionStringNumeric'
    readonly provider: SurveyDataProviderType.Union
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
    readonly isQuestionFirst: boolean
}
type SceneEnterDataType = SurveyQuestionStringNumericSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType.Union
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
}

type CallbackDataType = {
    /** provider id */
    p: number
    /** answer id */
    a: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringNumericScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionStringNumeric'
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

        if (!data.question.isRequired || !data.isQuestionFirst) {
            const inlineButtonData: CallbackDataType = {
                p: SurveyDataProviderType.getId(data.provider),
                a: data.question.id,
            }
            await ctx.replyWithHTML(this.text.survey.texMessageAditionaltInlineMenu, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            data.question.isRequired
                                ? null
                                : this.inlineButton({
                                      text: this.text.survey.buttonAditionaltInlineMenuSkip,
                                      action: SceneCallbackAction.surveySkipQuestion,
                                      data: inlineButtonData,
                                  }),
                            data.isQuestionFirst
                                ? null
                                : this.inlineButton({
                                      text: this.text.survey
                                          .buttonAditionaltInlineMenuBackToPrevious,
                                      action: SceneCallbackAction.surveyBackToPreviousQuestion,
                                      data: inlineButtonData,
                                  }),
                        ].compact,
                    ],
                },
            })
        }
        await ctx.replyWithHTML(data.question.questionText, removeKeyboard())

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
        if (ctx.callbackQuery.message) {
            await ctx.deleteMessage(ctx.callbackQuery.message.message_id)
        }

        if (
            !(
                data.data &&
                'a' in data.data &&
                'p' in data.data &&
                typeof data.data.a == 'string' &&
                typeof data.data.p == 'number'
            )
        ) {
            return this.completion.canNotHandleUnsafe()
        }
        const inlineButtonData = data.data as CallbackDataType

        const providerType = SurveyDataProviderType.getById(inlineButtonData.p)
        if (!providerType) return this.completion.canNotHandleUnsafe()

        const provider = this.dataProviderFactory.getSurveyProvider(providerType)
        if (!provider) return this.completion.canNotHandleUnsafe()

        const answerId = inlineButtonData.a
        const cache = await provider.getAnswersCache(this.content, this.user)
        const survaySource = await provider.getSurvey(this.content)
        const nextQuestion = SurveyUsageHelpers.findNextQuestion(survaySource, cache.passedAnswers)
        if (nextQuestion?.id != answerId) return this.completion.canNotHandleUnsafe()

        switch (data.action) {
            case SceneCallbackAction.surveyBackToPreviousQuestion:
                await provider.popAnswerFromCache(this.user)
                await ctx.replyWithHTML(
                    this.text.survey.textAditionaltInlineMenuBackToPreviousEventLog
                )
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: providerType,
                    allowContinueQuestion: false,
                })

            case SceneCallbackAction.surveySkipQuestion:
                const answer = SurveyUsageHelpers.getEmptyAnswerForQuestion(nextQuestion)
                await provider.pushAnswerToCache(this.user, answer)
                await ctx.replyWithHTML(this.text.survey.textAditionaltInlineMenuSkipEventLog)
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: providerType,
                    allowContinueQuestion: false,
                })
            default:
                return this.completion.canNotHandleUnsafe()
        }
    }

    // =====================
    // Private methods
    // =====================
}
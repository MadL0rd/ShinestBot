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
import { removeKeyboard } from 'telegraf/markup'
import { GptApiService } from 'src/business-logic/gpt-api/gpt-api.service'
import { YandexSpeechKitService } from 'src/business-logic/yandex-speech-kit/yandex-speech-kit.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionStringGptTipsSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionStringGptTips'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterDataType = SurveyQuestionStringGptTipsSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
    state: 'startMenu' | 'waitingForUserAnswer'
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringGptTipsScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionStringGptTips'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyContextProviderFactoryService,
        private readonly gptService: GptApiService,
        private readonly yandexSpeechKit: YandexSpeechKitService
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
        await this.logToUserHistory({ type: 'startSceneSurveyQuestionStringGptTips' })

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(this.text.surveyQuestionGptTip.textStartMenu)
        await ctx.replyWithHTML(
            data.question.questionText,
            this.keyboardMarkupWithAutoLayoutFor(
                [
                    this.text.surveyQuestionGptTip.buttonStartMenuContinue,
                    this.text.surveyQuestionGptTip.buttonStartMenuGptTip,
                    data.question.isRequired ? null : this.text.survey.buttonOptionalQuestionSkip,
                    data.allowBackToPreviousQuestion
                        ? this.text.survey.buttonBackToPreviousQuestion
                        : null,
                ].compact
            )
        )

        return this.completion.inProgress({
            ...data,
            state: 'startMenu',
        })
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

        switch (data.state) {
            case 'startMenu':
                return await this.handleMessageStartMenu(ctx, data)
            case 'waitingForUserAnswer':
                return await this.handleMessageWaitingForUserAnswer(ctx, data)
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

    private async handleMessageStartMenu(
        ctx: Context,
        data: ISceneData
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        const chat = ctx.chat
        if (!message || !('text' in message) || !chat) return this.completion.canNotHandle(data)

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        switch (message.text) {
            case this.text.survey.buttonOptionalQuestionSkip: {
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
            }
            case this.text.survey.buttonBackToPreviousQuestion: {
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

            case this.text.surveyQuestionGptTip.buttonStartMenuContinue: {
                await ctx.replyWithHTML(
                    this.text.surveyQuestionGptTip.textStartMenuEnterMessage,
                    removeKeyboard()
                )

                data.state = 'waitingForUserAnswer'
                return this.completion.inProgress(data)
            }

            case this.text.surveyQuestionGptTip.buttonStartMenuGptTip: {
                const gtpMessage = await ctx.replyWithHTML(
                    this.text.surveyQuestionGptTip.textWaitingForGptAnswer
                )
                await ctx.sendChatAction('typing')

                const dataString = JSON.stringify({
                    languageCode: this.content.language,
                    question: data.question,
                    userPassedAnswers: await provider.getAnswersCache(this.user),
                })
                const gptAnswer = await this.gptService.gptAnswer(
                    [
                        {
                            role: 'system',
                            text:
                                this.text.surveyQuestionGptTip.promptStartMenuGptTip +
                                '\n' +
                                dataString,
                        },
                    ],
                    Number(this.text.surveyQuestionGptTip.promptStartMenuGptTipTemperature)
                )
                await ctx.telegram.editMessageText(
                    chat.id,
                    gtpMessage.message_id,
                    undefined,
                    gptAnswer ?? this.text.common.errorMessage,
                    {
                        parse_mode: 'HTML',
                    }
                )

                return this.completion.inProgress(data)
            }
        }

        return this.completion.complete({
            sceneName: 'surveyQuestionStringGptTipsAnswerEditing',
            providerType: data.providerType,
            question: data.question,
            allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
            currentAnswer: message.text,
        })
    }

    private async handleMessageWaitingForUserAnswer(
        ctx: Context,
        data: ISceneData
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (!message) return this.completion.canNotHandle(data)

        let textFromMessage: string | undefined = undefined

        if ('text' in message) textFromMessage = message.text
        if ('voice' in message) {
            const fileId = message.voice.file_id
            textFromMessage = await this.yandexSpeechKit.recognizeTextFromAudio(fileId)

            if (!textFromMessage) {
                await ctx.replyWithHTML(this.text.common.errorMessage)
                return this.completion.inProgress(data)
            }
        }

        if (!textFromMessage) return this.completion.canNotHandle(data)

        return this.completion.complete({
            sceneName: 'surveyQuestionStringGptTipsAnswerEditing',
            providerType: data.providerType,
            question: data.question,
            allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
            currentAnswer: textFromMessage,
        })
    }
}

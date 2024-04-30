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
export class SurveyQuestionStringGptTipsUpdateWithGptSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionStringGptTipsUpdateWithGpt'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
    currentAnswer: string
}
type SceneEnterDataType = SurveyQuestionStringGptTipsUpdateWithGptSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionStringGptTips
    readonly allowBackToPreviousQuestion: boolean
    currentAnswer: string
    userWishes?: string
    gptAnswer?: string
    state: 'startMenu' | 'waitForUserWishes' | 'finalMenu'
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionStringGptTipsUpdateWithGptScene extends Scene<
    ISceneData,
    SceneEnterDataType
> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionStringGptTipsUpdateWithGpt'
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
        await this.logToUserHistory({ type: 'startSceneSurveyQuestionStringGptTipsUpdateWithGpt' })

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(
            this.text.surveyQuestionGptTip.textUpdateWithGptWishes,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyQuestionGptTip.buttonUpdateWithGptWishesYes,
                this.text.surveyQuestionGptTip.buttonUpdateWithGptWishesNo,
            ])
        )

        return this.completion.inProgress({ ...data, state: 'startMenu' })
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

        switch (data.state) {
            case 'startMenu':
                return await this.handleMessageStartMenu(ctx, data)
            case 'waitForUserWishes':
                return await this.handleMessageWaitForUserWishes(ctx, data)
            case 'finalMenu':
                return await this.handleMessageFinalMenu(ctx, data)
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
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

        switch (message.text) {
            case this.text.surveyQuestionGptTip.buttonUpdateWithGptWishesYes:
                await ctx.replyWithHTML(
                    this.text.surveyQuestionGptTip.textUpdateWithGptWishesEnter,
                    removeKeyboard()
                )
                data.state = 'waitForUserWishes'
                return this.completion.inProgress(data)

            case this.text.surveyQuestionGptTip.buttonUpdateWithGptWishesNo:
                return await this.sendGptAnswerAndComplete(ctx, data)

            default:
                data.userWishes = message.text
                return await this.sendGptAnswerAndComplete(ctx, data)
        }
    }

    private async handleMessageWaitForUserWishes(
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

        data.userWishes = textFromMessage
        return await this.sendGptAnswerAndComplete(ctx, data)
    }

    private async sendGptAnswerAndComplete(
        ctx: Context,
        data: ISceneData
    ): Promise<SceneHandlerCompletion> {
        const chat = ctx.chat
        if (!chat) return this.completion.canNotHandle(data)

        const gtpMessage = await ctx.replyWithHTML(
            this.text.surveyQuestionGptTip.textWaitingForGptAnswer
        )
        await ctx.sendChatAction('typing')

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
        const dataString = JSON.stringify({
            languageCode: this.content.language,
            currentUserAnswer: `Версия, которую нужно улучшить: ${data.currentAnswer}`,
            userWishes: data.userWishes
                ? `ОБЯЗАТЕЛЬНО УЧТИ СЛЕДУЮЩЕЕ ПОЖЕЛАНИЕ: ${data.userWishes}.`
                : 'Сделай на свой вкус с учетом предыдущих ответов из поля "userPassedAnswers"',
            question: data.question,
            userPassedAnswers: await provider.getAnswersCache(this.user),
        })
        const gptAnswer = await this.gptService.gptAnswer(
            [
                {
                    role: 'system',
                    text: this.text.surveyQuestionGptTip.promptUpdateWithGpt + '\n' + dataString,
                },
            ],
            Number(this.text.surveyQuestionGptTip.promptUpdateWithGptTemperature)
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

        await ctx.replyWithHTML(
            this.text.surveyQuestionGptTip.textUpdateWithGptSaveResult,
            this.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultYes,
                this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultTryAgain,
                this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultNo,
            ])
        )

        data.state = 'finalMenu'
        data.gptAnswer = gptAnswer
        return this.completion.inProgress(data)
    }

    private async handleMessageFinalMenu(
        ctx: Context,
        data: ISceneData
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

        switch (message.text) {
            case this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultYes:
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringGptTipsAnswerEditing',
                    providerType: data.providerType,
                    question: data.question,
                    allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
                    currentAnswer: data.gptAnswer ?? data.currentAnswer,
                })

            case this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultTryAgain:
                return this.sendGptAnswerAndComplete(ctx, data)

            case this.text.surveyQuestionGptTip.buttonUpdateWithGptSaveResultNo:
                return this.completion.complete({
                    sceneName: 'surveyQuestionStringGptTipsAnswerEditing',
                    providerType: data.providerType,
                    question: data.question,
                    allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
                    currentAnswer: data.currentAnswer,
                })
        }

        return this.completion.canNotHandle(data)
    }
}

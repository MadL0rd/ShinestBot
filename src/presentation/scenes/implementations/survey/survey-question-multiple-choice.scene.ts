import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { ReplyKeyboardMarkup, ReplyKeyboardRemove, Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionMultipleChoiceSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionMultipleChoice'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithMultipleChoice
    readonly selectedOptionsIdsList: string[]
    readonly isQuestionFirst: boolean
}
type SceneEnterDataType = SurveyQuestionMultipleChoiceSceneEntranceDto
interface ISceneData {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithMultipleChoice
    selectedOptionsIdsList: string[]
    readonly isQuestionFirst: boolean
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionMultipleChoiceScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionMultipleChoice'
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
        await this.logToUserHistory({ type: 'startSceneSurveyQuestionMultipleChoice' })

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(
            this.questionMessageText(data.question, data.selectedOptionsIdsList),
            this.optionstMarkup(data.question, data.selectedOptionsIdsList, data.isQuestionFirst)
        )

        return this.completion.inProgress({
            providerType: data.providerType,
            question: data.question,
            selectedOptionsIdsList: data.selectedOptionsIdsList,
            isQuestionFirst: data.isQuestionFirst,
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
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle(data)

        if (!data.selectedOptionsIdsList) return this.completion.complete()

        switch (message.text) {
            case this.text.survey.buttonOptionalQuestionSkip:
                if (data.question.isRequired) break
                await provider.pushAnswerToCache(this.user, {
                    type: 'multipleChoice',
                    question: data.question,
                    selectedOptionsIds: [],
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })

            case this.text.survey.buttonBackToPreviousQuestion:
                if (data.isQuestionFirst) break
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                    popAnswerOnStart: {
                        type: 'beforeQuestionWithId',
                        questionId: data.question.id,
                    },
                })
            case this.text.surveyQuestionMedia.buttonDone:
                if (this.isDoneButtonAvailable(data.question, data.selectedOptionsIdsList).isFalse)
                    break
                await provider.pushAnswerToCache(this.user, {
                    type: 'multipleChoice',
                    question: data.question,
                    selectedOptionsIds: data.selectedOptionsIdsList,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })
        }
        const selectedOption = data.question.options.find(
            (option) =>
                option.text ==
                message.text
                    .replace(`${this.text.common.symbolCross} `, '')
                    .replace(`${this.text.common.symbolCheckMark} `, '')
        )
        if (!selectedOption) return this.completion.canNotHandle(data)
        const optionIndex = data.selectedOptionsIdsList?.indexOf(selectedOption.id)
        if (optionIndex == -1 && data.selectedOptionsIdsList.length < data.question.maxCount) {
            data.selectedOptionsIdsList?.push(selectedOption.id)
        }
        if (optionIndex != -1) {
            data.selectedOptionsIdsList?.splice(optionIndex, 1)
        }
        await ctx.replyWithHTML(
            this.questionMessageText(data.question, data.selectedOptionsIdsList),
            this.optionstMarkup(data.question, data.selectedOptionsIdsList, data.isQuestionFirst)
        )

        return this.completion.inProgress(data)
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
    private questionMessageText(
        question: Survey.QuestionWithMultipleChoice,
        selectedOptionsIdsList: string[]
    ): string {
        const selectedOptionsText = question.options
            .filter((option) => selectedOptionsIdsList.includes(option.id))
            .map((option) => `<b>${option.text}</b>`)
            .join(', ')
        return `${question.questionText}\n\n${this.text.survey.textDescriptionQuestionMultipleChoice
            .replace('minCount', question.minCount.toString())
            .replace('maxCount', question.maxCount.toString())}\n${selectedOptionsText}`
    }
    private optionstMarkup(
        question: Survey.QuestionWithMultipleChoice,
        selectedOptionsIdsList: string[],
        isQuestionFirst: boolean
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        const markup = this.keyboardMarkupWithAutoLayoutFor(
            this.optionsButtonsList(question.options, selectedOptionsIdsList)
        )
        if ('keyboard' in markup.reply_markup) {
            markup.reply_markup.keyboard = [
                [
                    this.isDoneButtonAvailable(question, selectedOptionsIdsList)
                        ? this.text.surveyQuestionMedia.buttonDone
                        : null,
                    question.isRequired ? null : this.text.survey.buttonOptionalQuestionSkip,
                ].compact,
                ...markup.reply_markup.keyboard,
                [isQuestionFirst ? null : this.text.survey.buttonBackToPreviousQuestion].compact,
            ]
        }
        return markup
    }

    private isDoneButtonAvailable(
        question: Survey.QuestionWithMultipleChoice,
        selectedOptionsIdsList: string[]
    ): boolean {
        return (
            selectedOptionsIdsList.length >= question.minCount &&
            selectedOptionsIdsList.length <= question.maxCount
        )
    }

    private optionsButtonsList(
        options: Survey.AnswerOption[],
        selectedOptionsIdsList: string[]
    ): string[] {
        return options.map((option) => {
            return selectedOptionsIdsList.includes(option.id)
                ? `${this.text.common.symbolCheckMark} ${option.text}`
                : `${this.text.common.symbolCross} ${option.text}`
        })
    }
}

import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Markup } from 'telegraf'
import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from 'telegraf/types'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionMultipleChoiceSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionMultipleChoice'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithMultipleChoice
    readonly selectedOptionsIdsList: string[]
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterDataType = SurveyQuestionMultipleChoiceSceneEntranceDto
type ISceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithMultipleChoice
    selectedOptionsIdsList: string[]
    readonly allowBackToPreviousQuestion: boolean
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionMultipleChoiceScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionMultipleChoice'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
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

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        await this.ddi.sendMediaContent(data.question.media)
        await this.ddi.sendHtml(
            this.questionSelectionMenuText(data.question, data.selectedOptionsIdsList),
            this.optionsMarkup(
                data.question,
                data.selectedOptionsIdsList,
                data.allowBackToPreviousQuestion
            )
        )

        return this.completion.inProgress({
            providerType: data.providerType,
            question: data.question,
            selectedOptionsIdsList: data.selectedOptionsIdsList,
            allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

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
                if (!data.allowBackToPreviousQuestion) break
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

            default:
                break
        }
        const selectedOption = data.question.options.find(
            (option) =>
                option.text ==
                message.text
                    .replace(`${this.text.surveyQuestionMultipleChoice.textSelectionTrue} `, '')
                    .replace(`${this.text.surveyQuestionMultipleChoice.textSelectionFalse} `, '')
        )
        if (!selectedOption) return this.completion.canNotHandle()
        const optionIndex = data.selectedOptionsIdsList?.indexOf(selectedOption.id)
        if (optionIndex === -1 && data.selectedOptionsIdsList.length < data.question.maxCount) {
            data.selectedOptionsIdsList?.push(selectedOption.id)
        }
        if (optionIndex != -1) {
            data.selectedOptionsIdsList?.splice(optionIndex, 1)
        }
        await this.ddi.sendHtml(
            this.questionSelectionMenuText(data.question, data.selectedOptionsIdsList),
            this.optionsMarkup(
                data.question,
                data.selectedOptionsIdsList,
                data.allowBackToPreviousQuestion
            )
        )

        return this.completion.inProgress(data)
    }

    // =====================
    // Private methods
    // =====================
    private questionSelectionMenuText(
        question: Survey.QuestionWithMultipleChoice,
        selectedOptionsIdsList: string[]
    ): string {
        const description = this.text.surveyQuestionMultipleChoice.textDescription({
            minCount: question.minCount,
            maxCount: question.maxCount,
        })

        let result = description

        const separator = '\n\n'

        if (selectedOptionsIdsList.isNotEmpty) {
            const selectedOptionsText = question.options
                .filter((option) => selectedOptionsIdsList.includes(option.id))
                .map((option) => `<b>${option.text}</b>`)
                .join(', ')
            result += `${separator}${this.text.surveyQuestionMultipleChoice.textSelectionPrefix}\n${selectedOptionsText}`
        }

        if (question.maxCount === selectedOptionsIdsList.length) {
            result += separator + this.text.surveyQuestionMultipleChoice.textMaxCountReached
        }
        if (question.minCount > selectedOptionsIdsList.length) {
            result += separator + this.text.surveyQuestionMultipleChoice.textMinCountDoesNotReached
        }

        return result
    }
    private optionsMarkup(
        question: Survey.QuestionWithMultipleChoice,
        selectedOptionsIdsList: string[],
        allowBackToPreviousQuestion: boolean
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
                [allowBackToPreviousQuestion ? this.text.survey.buttonBackToPreviousQuestion : null]
                    .compact,
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
                ? `${this.text.surveyQuestionMultipleChoice.textSelectionTrue} ${option.text}`
                : `${this.text.surveyQuestionMultipleChoice.textSelectionFalse} ${option.text}`
        })
    }
}

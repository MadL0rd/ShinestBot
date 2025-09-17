import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export interface SurveyQuestionOptionsSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionOptions'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithOptions
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterData = SurveyQuestionOptionsSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionWithOptions
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionOptionsScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionOptions'
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

        await this.ddi.sendMediaContent(data.question.media)
        await this.ddi.sendHtml(
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

            default:
                break
        }

        const selectedOption = data.question.options.find((option) => option.text === message.text)
        if (!selectedOption) return this.completion.canNotHandle()

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

    // =====================
    // Private methods
    // =====================
}

import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import {
    ISurveyContextProvider,
    SurveyContextProviderType,
} from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveyFinalSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyFinal'
    readonly providerType: SurveyContextProviderType.Union
}
type SceneEnterData = SurveyFinalSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly buttonRecord: Record<string, string>
    readonly sceneEnterId: number
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyFinalScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyFinal'
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
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
        const cache = await provider.prepareConsistentAnswersCache(this.user)

        const answersText = Survey.Formatter.generateTextFromPassedAnswers({
            answers: cache.passedAnswers,
            text: this.text,
            filtrationMode: 'forUser',
            putIndexes: true,
        })

        const sceneEnterId = Number(Date.new())
        const inlineKeyboard = [
            generateInlineButton(
                {
                    text: this.text.surveyFinal.buttonDone,
                    action: {
                        actionType: 'currentSceneAction',
                        data: { id: 'done', i: sceneEnterId },
                    },
                },
                this.name
            ),
            ...cache.passedAnswers.map((answer, index) =>
                answer.question.showInTheLastStep
                    ? generateInlineButton(
                          {
                              text: this.text.surveyFinal.buttonInlineEdit({
                                  questionTitle: answer.question.publicTitle,
                              }),
                              action: {
                                  actionType: 'currentSceneAction',
                                  data: { id: index + 1, i: sceneEnterId },
                              },
                          },
                          this.name
                      )
                    : null
            ).compact,
        ].map((button) => [button])

        const keyboardRecord = {
            done: this.text.surveyFinal.buttonDone,
            return: this.text.common.buttonReturnToMainMenu,
        }

        await this.ddi.sendHtml(answersText, { reply_markup: { remove_keyboard: true } })
        await this.ddi.sendHtml(this.text.surveyFinal.text, {
            reply_markup: { inline_keyboard: inlineKeyboard },
        })

        return this.completion.inProgress({
            providerType: data.providerType,
            buttonRecord: keyboardRecord,
            sceneEnterId: sceneEnterId,
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        return await this.startEditAnswerAndCompleteIfPossible({
            provider: provider,
            questionIndexRaw: message.text,
        }).then((completion) => completion ?? this.completion.canNotHandle())
    }

    override async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        if (!this.user.sceneData?.data) {
            return this.completion.doNothing()
        }
        const sceneData = this.restoreData(this.user.sceneData?.data)
        if (!sceneData) {
            logger.error('Scene data corrupted')
            return this.completion.doNothing()
        }
        if (!ctx.callbackQuery.message) {
            logger.error(`Cannot find message in callbackQuery`)
            return this.completion.doNothing()
        }
        if (
            this.user.sceneData.sceneName !== this.name ||
            !('i' in data.data) ||
            sceneData.sceneEnterId != data.data.i
        ) {
            await this.ddi.deleteMessage(ctx.callbackQuery.message.message_id).catch(() => {})
            return this.completion.doNothing()
        }

        const provider = this.dataProviderFactory.getSurveyContextProvider(sceneData.providerType)

        if (data.actionType !== 'currentSceneAction') {
            return this.completion.doNothing()
        }

        const message = ctx.callbackQuery.message
        if (!message) return this.completion.canNotHandle()

        if (!('id' in data.data)) {
            logger.error(`Cannot find button id in callbackData`)
            return this.completion.doNothing()
        }
        const buttonId = String(data.data.id)
        const selectedButtonText = sceneData.buttonRecord[buttonId]

        switch (selectedButtonText) {
            case this.text.surveyFinal.buttonDone: {
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})

                const nextSceneDto = await provider.completeSurveyAndGetNextScene(this.user)
                return this.completion.complete(nextSceneDto)
            }

            case this.text.common.buttonReturnToMainMenu:
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})
                return this.completion.complete({ sceneName: 'mainMenu' })

            default:
                return await this.startEditAnswerAndCompleteIfPossible({
                    ctx: ctx,
                    provider: provider,
                    questionIndexRaw: buttonId,
                }).then((completion) => completion ?? this.completion.doNothing())
        }
    }

    // =====================
    // Private methods
    // =====================

    private async startEditAnswerAndCompleteIfPossible(args: {
        ctx?: Context<Update.CallbackQueryUpdate>
        provider: ISurveyContextProvider
        questionIndexRaw: string | number
    }) {
        const { ctx, provider, questionIndexRaw } = args

        const cache = await provider.getAnswersCache(this.user)
        const questionIndex = parseInt(`${questionIndexRaw}`)
        if (
            questionIndex &&
            !Number.isNaN(questionIndex) &&
            questionIndex <= cache.passedAnswers.length &&
            questionIndex >= 1
        ) {
            const messageId = ctx?.callbackQuery.message?.message_id
            if (messageId) await this.ddi.resetMessageInlineKeyboard(messageId)

            return this.completion.complete({
                sceneName: 'survey',
                providerType: provider.type,
                allowContinueQuestion: false,
                allowBackToPreviousQuestion: false,
                popAnswerOnStart: {
                    type: 'byQuestionIndex',
                    questionIndex: questionIndex - 1,
                },
            })
        }

        return null
    }
}

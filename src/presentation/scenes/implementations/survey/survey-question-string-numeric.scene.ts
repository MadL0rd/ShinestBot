import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Types } from 'telegraf'
import { removeKeyboard } from 'telegraf/markup'
import { Update } from 'telegraf/types'
import z from 'zod'
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
export interface SurveyQuestionStringNumericSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionStringNumeric'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterData = SurveyQuestionStringNumericSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionString | Survey.QuestionNumeric
    navigationMessageId?: number
    contentMessageId?: number
}

const sceneDataSchema = z.object({
    providerType: z.enum(SurveyContextProviderType.allCases),
    question: z
        .any()
        .transform((question) => question as Survey.QuestionString | Survey.QuestionNumeric),
    navigationMessageId: z.number().optional(),
    contentMessageId: z.number().optional(),
})

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
export class SurveyQuestionStringNumericScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionStringNumeric'
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

        const sceneData: SceneData = data

        if (data.allowBackToPreviousQuestion) {
            const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
            const answersCache = await provider.getAnswersCache(this.user)
            const prevAnswer = answersCache.passedAnswers.last
            if (!prevAnswer) {
                await this.ddi.sendHtml(data.question.questionText, removeKeyboard())
                return this.completion.inProgress(data)
            }
            const navigationMessageText =
                prevAnswer.question.serviceMessageNavigationText +
                ' ' +
                Survey.Helper.getAnswerStringValue(prevAnswer, this.text)

            const inlineButtonData: CallbackDataType = {
                p: SurveyContextProviderType.getId(data.providerType),
                a: data.question.id,
            }
            const navigationMessage = await this.ddi.sendHtml(navigationMessageText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            data.allowBackToPreviousQuestion
                                ? this.inlineButton({
                                      text: this.text.survey.buttonBackToPreviousQuestion,
                                      action: {
                                          actionType: 'surveyBackToPreviousQuestion',
                                          data: inlineButtonData,
                                      },
                                  })
                                : null,
                        ].compact,
                    ],
                },
            })
            sceneData.navigationMessageId = navigationMessage.message_id
        }

        const contentKeyboard: Types.ExtraReplyMessage = data.question.isRequired
            ? removeKeyboard()
            : {
                  reply_markup: {
                      inline_keyboard: [
                          [
                              this.inlineButton({
                                  text: this.text.survey.buttonInlineSkip,
                                  action: {
                                      actionType: 'surveySkipQuestion',
                                      data: {
                                          p: SurveyContextProviderType.getId(data.providerType),
                                          a: data.question.id,
                                      },
                                  },
                              }),
                          ],
                      ],
                      remove_keyboard: true,
                  },
              }

        const contentMessage = await this.ddi.sendHtml(data.question.questionText, contentKeyboard)
        sceneData.contentMessageId = contentMessage.message_id

        return this.completion.inProgress(sceneData)
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
        if (!message) return this.completion.canNotHandle()

        switch (data.question.type) {
            case 'numeric': {
                if (message.type !== 'text') return this.completion.canNotHandle()
                const convertedAnswer = parseFloat(
                    message.text.replaceAll(',', '.').trim().replaceAll(' ', '')
                )
                if (Number.isNaN(convertedAnswer)) {
                    await this.ddi.sendHtml(this.text.survey.errorMessageAnswerIsNotNumber)
                    return this.completion.inProgress(data)
                }
                if (data.contentMessageId) {
                    await this.ddi.deleteMessage(data.contentMessageId).catch(() => {})
                }
                await provider.pushAnswerToCache(this.user, {
                    type: 'numeric',
                    question: data.question,
                    selectedNumber: convertedAnswer,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })
            }
            case 'string':
                if (message.type !== 'text') return this.completion.canNotHandle()
                if (data.contentMessageId) {
                    await this.ddi.deleteMessage(data.contentMessageId).catch(() => {})
                }
                await provider.pushAnswerToCache(this.user, {
                    type: 'string',
                    question: data.question,
                    selectedString: message.text,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })
        }
        return this.completion.canNotHandle()
    }

    override async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        if (ctx.callbackQuery.message) {
            await this.ddi.deleteMessage(ctx.callbackQuery.message.message_id).catch(() => {})
        }

        if (
            !(
                data.data &&
                'a' in data.data &&
                'p' in data.data &&
                typeof data.data.a === 'string' &&
                typeof data.data.p === 'number'
            )
        ) {
            return this.completion.canNotHandle()
        }
        const inlineButtonData = data.data as CallbackDataType

        const providerType = SurveyContextProviderType.getById(inlineButtonData.p)
        if (!providerType) return this.completion.canNotHandle()

        const provider = this.dataProviderFactory.getSurveyContextProvider(providerType)
        if (!provider) return this.completion.canNotHandle()

        const message = ctx.callbackQuery.message
        if (!message) return this.completion.canNotHandle()

        const questionId = inlineButtonData.a
        const nextQuestion = await provider.getNextQuestion(this.user)
        if (nextQuestion?.id != questionId) return this.completion.canNotHandle()

        switch (data.actionType) {
            case 'surveyBackToPreviousQuestion': {
                const sceneData = sceneDataSchema.safeParse(this.user.sceneData?.data).data
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch(() => {})
                if (sceneData && sceneData.contentMessageId) {
                    await this.ddi.deleteMessage(sceneData.contentMessageId).catch(() => {})
                }
                if (sceneData && sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: providerType,
                    allowContinueQuestion: false,
                    popAnswerOnStart: {
                        type: 'beforeQuestionWithId',
                        questionId: questionId,
                    },
                })
            }

            case 'surveySkipQuestion': {
                if (nextQuestion.isRequired) return this.completion.canNotHandle()

                const sceneData = sceneDataSchema.safeParse(this.user.sceneData?.data).data
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})
                if (sceneData && sceneData.contentMessageId) {
                    await this.ddi.deleteMessage(sceneData.contentMessageId).catch(() => {})
                }
                if (sceneData && sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }

                const answer = Survey.Helper.getEmptyAnswerForQuestion(nextQuestion)
                await provider.pushAnswerToCache(this.user, answer)
                await this.ddi.sendHtml(this.text.survey.textInlineSkipEventLog)
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: providerType,
                    allowContinueQuestion: false,
                })
            }
            default:
                return this.completion.canNotHandle()
        }
    }

    // =====================
    // Private methods
    // =====================
}

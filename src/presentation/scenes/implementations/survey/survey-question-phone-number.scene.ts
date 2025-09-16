import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { phoneNumberSchema } from 'src/presentation/utils/format-phone-number.util'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Markup, Types } from 'telegraf'
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
export interface SurveyQuestionPhoneNumberSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionPhoneNumber'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionTelephoneNumber
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterData = SurveyQuestionPhoneNumberSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionTelephoneNumber
    state: 'started' | 'selfWritingSelected'
    navigationMessageId?: number
    contentMessageIds: number[]
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
export class SurveyQuestionPhoneNumberScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionPhoneNumber'
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
        const sceneData: Omit<SceneData, 'state'> = { ...data, contentMessageIds: [] }
        // Navigation
        if (!data.question.isRequired || data.allowBackToPreviousQuestion) {
            const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
            const answersCache = await provider.getAnswersCache(this.user)
            const prevAnswer = answersCache.passedAnswers.last
            if (!prevAnswer) {
                const mediaContentMessages = await this.ddi.sendMediaContent(data.question.media)
                const contentMessage = await this.ddi.sendHtml(
                    `${data.question.questionText}\n\n${this.text.surveyQuestionPhoneNumber.text}`,
                    this.keyboardMarkupWithAutoLayoutFor([
                        {
                            text: this.text.surveyQuestionPhoneNumber.buttonSendContact,
                            request_contact: true,
                        },
                        this.text.surveyQuestionPhoneNumber.buttonEnterPhoneNumber,
                    ])
                )
                return this.completion.inProgress({
                    ...data,
                    contentMessageIds: [
                        contentMessage.message_id,
                        ...mediaContentMessages.massageIds,
                    ],
                    state: 'started',
                })
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
                                      text: this.text.survey.buttonInlineBackToPrevious,
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
            ? {
                  reply_markup: {
                      keyboard: Markup.keyboard([
                          {
                              text: this.text.surveyQuestionPhoneNumber.buttonSendContact,
                              request_contact: true,
                          },
                          this.text.surveyQuestionPhoneNumber.buttonEnterPhoneNumber,
                      ]).reply_markup.keyboard,
                      resize_keyboard: true,
                  },
              }
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
                      keyboard: Markup.keyboard([
                          {
                              text: this.text.surveyQuestionPhoneNumber.buttonSendContact,
                              request_contact: true,
                          },
                          this.text.surveyQuestionPhoneNumber.buttonEnterPhoneNumber,
                      ]).reply_markup.keyboard,
                      resize_keyboard: true,
                  },
              }
        const mediaContentMessages = await this.ddi.sendMediaContent(data.question.media)
        const contentMessage = await this.ddi.sendHtml(
            `${data.question.questionText}\n\n${this.text.surveyQuestionPhoneNumber.text}`,
            contentKeyboard
        )
        sceneData.contentMessageIds = [
            contentMessage.message_id,
            ...mediaContentMessages.massageIds,
        ]
        return this.completion.inProgress({ ...sceneData, state: 'started' })
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
        const message = ctx.message
        if (!message) return this.completion.canNotHandle()

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        switch (data.state) {
            case 'started':
                if (
                    message.type === 'text' &&
                    message.text === this.text.surveyQuestionPhoneNumber.buttonEnterPhoneNumber
                ) {
                    await this.ddi.sendHtml(
                        this.text.surveyQuestionPhoneNumber.textEnterPhoneNumber,
                        Markup.removeKeyboard()
                    )
                    data.state = 'selfWritingSelected'
                    return this.completion.inProgress(data)
                }
                break

            case 'selfWritingSelected':
                break
        }

        const phoneNumber = phoneNumberSchema.safeParse(
            message.type === 'contact'
                ? message.contact.phone_number
                : message.type === 'text'
                  ? message.text
                  : ''
        ).data
        if (!phoneNumber) {
            await this.ddi.sendHtml(
                this.text.surveyQuestionPhoneNumber.errorMessageAnswerIsNotPhoneNumber
            )
            return this.completion.canNotHandle({ didAlreadySendErrorMessage: true })
        }

        this.logToUserHistory({
            type: 'sendPhone',
            messageType: message.type === 'contact' ? 'contact' : 'text',
            phone: phoneNumber,
        })

        if (data.contentMessageIds) {
            await this.ddi.deleteMessages(data.contentMessageIds).catch(() => {})
        }

        await provider.pushAnswerToCache(this.user, {
            type: 'phoneNumber',
            question: data.question,
            selectedString: phoneNumber,
        })
        return this.completion.complete({
            sceneName: 'survey',
            providerType: data.providerType,
            allowContinueQuestion: false,
        })
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

        const questionId = inlineButtonData.a
        const nextQuestion = await provider.getNextQuestion(this.user)
        if (nextQuestion?.id != questionId) return this.completion.canNotHandle()
        const sceneData = this.restoreData(this.user.sceneData)

        switch (data.actionType) {
            case 'surveyBackToPreviousQuestion':
                await this.ddi.sendHtml(this.text.survey.textInlineBackToPreviousEventLog)
                if (sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
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

            case 'surveySkipQuestion': {
                if (nextQuestion.isRequired) return this.completion.canNotHandle()

                if (sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
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

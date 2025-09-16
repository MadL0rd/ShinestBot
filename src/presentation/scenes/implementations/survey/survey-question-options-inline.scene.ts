import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
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
export interface SurveyQuestionOptionsInlineSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionOptionsInline'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionAnswerOptionInline
    readonly allowBackToPreviousQuestion: boolean
}
type SceneEnterData = SurveyQuestionOptionsInlineSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionAnswerOptionInline
    readonly sceneEnterId: number
    readonly buttonRecord: Record<string, string>
    navigationMessageId: number | undefined
    contentMessageIds: number[]
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionOptionsInlineScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionOptionsInline'
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
        const sceneEnterId = Number(Date.new())
        const keyboardRecord = data.question.options.reduce(
            (acc, option) => {
                acc[option.id] = option.text
                return acc
            },
            {} as Record<string, string>
        )

        const navigationKeyboard = []
        if (data.allowBackToPreviousQuestion.isTrue) {
            navigationKeyboard.push([
                generateInlineButton(
                    {
                        text: this.text.survey.buttonBackToPreviousQuestion,
                        action: {
                            actionType: 'currentSceneAction',
                            data: { id: 'previous', i: sceneEnterId },
                        },
                    },
                    this.name
                ),
            ])
            keyboardRecord['previous'] = this.text.survey.buttonBackToPreviousQuestion
        }

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
        const answersCache = await provider.getAnswersCache(this.user)
        const inlineKeyboard = data.question.options.map((option) => [
            generateInlineButton(
                {
                    text: option.text,
                    action: {
                        actionType: 'currentSceneAction',
                        data: { id: option.id, i: sceneEnterId },
                    },
                },
                this.name
            ),
        ])
        if (data.question.isRequired !== true) {
            inlineKeyboard.push([
                generateInlineButton(
                    {
                        text: this.text.survey.buttonInlineSkip,
                        action: {
                            actionType: 'currentSceneAction',
                            data: { id: 'skip', i: sceneEnterId },
                        },
                    },
                    this.name
                ),
            ])
            keyboardRecord['skip'] = this.text.survey.buttonOptionalQuestionSkip
        }

        const prevAnswer = answersCache.passedAnswers.last
        let navigationMessageId = undefined
        if (prevAnswer) {
            const navigationMessageText =
                prevAnswer.question.serviceMessageNavigationText +
                ' ' +
                Survey.Helper.getAnswerStringValue(prevAnswer, this.text)
            navigationMessageId = await this.ddi
                .sendHtml(navigationMessageText, {
                    reply_markup: { inline_keyboard: navigationKeyboard },
                })
                .then((message) => message.message_id)
        }

        const contentMediaMessages = await this.ddi.sendMediaContent(data.question.media)
        const contentMessage = await this.ddi.sendHtml(data.question.questionText, {
            reply_markup: { inline_keyboard: inlineKeyboard },
        })

        return this.completion.inProgress({
            ...data,
            navigationMessageId,
            contentMessageIds: [...contentMediaMessages.massageIds, contentMessage.message_id],
            sceneEnterId: sceneEnterId,
            buttonRecord: keyboardRecord,
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        if (!data) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        return this.completion.canNotHandle()
    }

    override async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.callbackQuery.message
        if (!message) return this.completion.canNotHandle()

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

        if (!('id' in data.data)) {
            logger.error(`Cannot find button id in callbackData`)
            return this.completion.doNothing()
        }
        const buttonId = String(data.data.id)
        const selectedButtonText = sceneData.buttonRecord[buttonId]

        switch (selectedButtonText) {
            case this.text.survey.buttonOptionalQuestionSkip:
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})
                if (sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
                }

                await provider.pushAnswerToCache(this.user, {
                    type: 'optionsInline',
                    question: sceneData.question,
                    selectedOptionId: null,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: provider.type,
                    allowContinueQuestion: false,
                })

            case this.text.survey.buttonBackToPreviousQuestion:
                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})
                if (sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
                }

                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: provider.type,
                    allowContinueQuestion: false,
                    popAnswerOnStart: {
                        type: 'beforeQuestionWithId',
                        questionId: sceneData.question.id,
                    },
                })

            default: {
                const selectedOption = sceneData.question.options.find(
                    (option) => option.text === selectedButtonText
                )
                if (!selectedOption) {
                    logger.error(`Cannot find button`)
                    return this.completion.doNothing()
                }

                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})

                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
                }
                await provider.pushAnswerToCache(this.user, {
                    type: 'optionsInline',
                    question: sceneData.question,
                    selectedOptionId: selectedOption.id,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: sceneData.providerType,
                    allowContinueQuestion: false,
                })
            }
        }
    }

    // =====================
    // Private methods
    // =====================
}

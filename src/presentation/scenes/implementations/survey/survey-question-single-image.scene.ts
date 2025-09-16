import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import {
    ExtendedMessage,
    ExtendedMessageContext,
} from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Markup, Types } from 'telegraf'
import { InlineKeyboardButton, Update } from 'telegraf/types'
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
export interface SurveyQuestionSingleImageSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'surveyQuestionSingleImage'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionSingleImage
    readonly allowBackToPreviousQuestion: boolean
    readonly mediaGroupBuffer: Survey.TelegramFileData[]
}
type SceneEnterData = SurveyQuestionSingleImageSceneEntranceDto
type SceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionSingleImage
    readonly allowBackToPreviousQuestion: boolean
    readonly sceneEnterId: number
    mediaGroupBuffer: Survey.TelegramFileData[]
    buttonRecord: Record<string, string>
    navigationMessageId?: number
    contentMessageIds: number[]
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionSingleImageScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionSingleImage'
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
        const inlineKeyboard: InlineKeyboardButton[][] = []
        const buttonRecord: Record<string, string> = {}
        if (data.allowBackToPreviousQuestion.isTrue) {
            inlineKeyboard.push([
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
            buttonRecord['previous'] = this.text.survey.buttonBackToPreviousQuestion
        }

        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)
        const answersCache = await provider.getAnswersCache(this.user)
        const prevAnswer = answersCache.passedAnswers.last
        if (!prevAnswer) {
            const contentMessages = await this.ddi.sendMediaContent({
                ...data.question.media,
                caption: data.question.questionText,
            })
            return this.completion.inProgress({
                ...data,
                sceneEnterId: sceneEnterId,
                buttonRecord: buttonRecord,
                contentMessageIds: contentMessages.massageIds,
            })
        }
        const navigationMessageText =
            prevAnswer.question.serviceMessageNavigationText +
            ' ' +
            Survey.Helper.getAnswerStringValue(prevAnswer, this.text)

        const navigationMessage = await this.ddi.sendHtml(navigationMessageText, {
            reply_markup: { inline_keyboard: inlineKeyboard },
        })

        if (data.question.isRequired.isFalse) {
            buttonRecord['skip'] = this.text.survey.buttonOptionalQuestionSkip
        }
        const contentKeyboard: Types.ExtraReplyMessage = data.question.isRequired
            ? Markup.removeKeyboard()
            : {
                  reply_markup: {
                      inline_keyboard: [
                          [
                              generateInlineButton(
                                  {
                                      text: this.text.survey.buttonOptionalQuestionSkip,
                                      action: {
                                          actionType: 'currentSceneAction',
                                          data: { id: 'skip', i: sceneEnterId },
                                      },
                                  },
                                  this.name
                              ),
                          ],
                      ],
                      remove_keyboard: true,
                  },
              }

        const mediaContentMessages = await this.ddi.sendMediaContent(data.question.media)
        const contentMessage = await this.ddi.sendHtml(data.question.questionText, contentKeyboard)

        return this.completion.inProgress({
            ...data,
            sceneEnterId: sceneEnterId,
            buttonRecord: buttonRecord,
            navigationMessageId: navigationMessage.message_id,
            contentMessageIds: [contentMessage.message_id, ...mediaContentMessages.massageIds],
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }
        if (!message) return this.completion.canNotHandle()

        // Handling media files uploaded by the user.
        const contextMedia = this.getMediaFromContext(ctx)
        const firstPhoto = contextMedia.find((media) => media.fileType === 'photo')
        if (firstPhoto) {
            data.mediaGroupBuffer = [firstPhoto]

            const inlineKeyboard: InlineKeyboardButton[][] = [
                [
                    generateInlineButton(
                        {
                            text: this.text.surveyQuestionMedia.buttonDone,
                            action: {
                                actionType: 'currentSceneAction',
                                data: { id: 'done', i: data.sceneEnterId },
                            },
                        },
                        this.name
                    ),
                ],
                data.buttonRecord['skip']
                    ? [
                          generateInlineButton(
                              {
                                  text: this.text.survey.buttonOptionalQuestionSkip,
                                  action: {
                                      actionType: 'currentSceneAction',
                                      data: { id: 'skip', i: data.sceneEnterId },
                                  },
                              },
                              this.name
                          ),
                      ]
                    : [],
                // data.buttonRecord['previous']
                //     ? [
                //           generateInlineButton(
                //               {
                //                   text: this.text.survey.buttonBackToPreviousQuestion,
                //                   action: {
                //                       actionType: 'currentSceneAction',
                //                       data: { id: 'previous', i: data.sceneEnterId },
                //                   },
                //               },
                //               this.name
                //           ),
                //       ]
                //     : [],
            ]
            data.buttonRecord = {
                ...data.buttonRecord,
                done: this.text.surveyQuestionMedia.buttonDone,
            }
            await this.ddi.sendPhoto({
                photo: data.mediaGroupBuffer[0].telegramFileId,
                caption:
                    data.question.serviceMessageFilledText ??
                    this.text.surveyQuestionMedia.commonFilled,
                reply_markup: { inline_keyboard: inlineKeyboard },
                parse_mode: 'HTML',
            })
            return this.completion.inProgress(data)
        }

        // If none of the cases match, indicate that the handler cannot process the data.
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
            this.user.sceneData?.sceneName !== this.name ||
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
                    type: 'singleImage',
                    question: sceneData.question,
                    media: [],
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

            case this.text.surveyQuestionMedia.buttonDone: {
                const mediaFile = sceneData.mediaGroupBuffer.find(
                    (media) => media.fileType === 'photo'
                )
                if (!mediaFile) return this.completion.doNothing()

                await this.ddi.resetMessageInlineKeyboard(message.message_id).catch((e) => {})

                if (sceneData.contentMessageIds) {
                    await this.ddi.deleteMessages(sceneData.contentMessageIds).catch(() => {})
                }
                if (sceneData.navigationMessageId) {
                    await this.ddi.deleteMessage(sceneData.navigationMessageId).catch(() => {})
                }
                await provider.pushAnswerToCache(this.user, {
                    type: sceneData.question.type,
                    question: sceneData.question,
                    media: [mediaFile].compact,
                })
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: provider.type,
                    allowContinueQuestion: false,
                })
            }

            default:
                return this.completion.doNothing()
        }
    }

    // =====================
    // Private methods
    // =====================
    private getMediaFromContext(ctx: ExtendedMessageContext): Survey.TelegramFileData[] {
        // Checking if context contains media group.
        if (ctx.mediaGroup?.type === 'photosAndVideos') {
            // Looping through media group messages to extract media.
            return ctx.mediaGroup.messages.map((message) => this.getFileIdAndType(message)).compact
        } else {
            // If not media group, extract media from message directly.
            return [this.getFileIdAndType(ctx.message)].compact
        }
    }

    private getFileIdAndType(
        message: ExtendedMessage | undefined
    ): Survey.TelegramFileData | undefined {
        switch (message?.type) {
            case 'photo':
                return {
                    fileType: 'photo',
                    telegramFileUniqueId: message.photoDefaultSize.file_unique_id,
                    telegramFileId: message.photoDefaultSize.file_id,
                    receiveTimestamp: Date.new(),
                }
                break

            case 'video':
                return {
                    fileType: 'video',
                    telegramFileUniqueId: message.video.file_unique_id,
                    telegramFileId: message.video.file_id,
                    receiveTimestamp: Date.new(),
                }
                break

            default:
                break
        }

        return undefined
    }
}

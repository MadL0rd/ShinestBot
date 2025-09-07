import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import {
    ExtendedMessage,
    ExtendedMessageContext,
} from 'src/utils/telegraf-middlewares/extended-message-context'
import { Markup } from 'telegraf'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionMediaSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionMedia'
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionMedia
    readonly allowBackToPreviousQuestion: boolean
    readonly mediaGroupBuffer: Survey.TelegramFileData[]
}
type SceneEnterDataType = SurveyQuestionMediaSceneEntranceDto
type ISceneData = {
    readonly providerType: SurveyContextProviderType.Union
    readonly question: Survey.QuestionMedia
    readonly allowBackToPreviousQuestion: boolean
    mediaGroupBuffer: Survey.TelegramFileData[]
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionMediaScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyQuestionMedia'
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

        const sceneData: ISceneData = {
            providerType: data.providerType,
            question: data.question,
            allowBackToPreviousQuestion: data.allowBackToPreviousQuestion,
            mediaGroupBuffer: data.mediaGroupBuffer,
        }
        await this.showMediaUploadingMenu(sceneData)

        return this.completion.inProgress(sceneData)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        // Logging the scene's handling process.
        // Restoring data and checking for corruption.
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        // Retrieving the appropriate provider based on the data.
        const provider = this.dataProviderFactory.getSurveyContextProvider(data.providerType)

        // Handling various user inputs based on message text.
        if (ctx.message.type === 'text') {
            switch (ctx.message.text) {
                case this.text.survey.buttonOptionalQuestionSkip: {
                    if (data.question.isRequired) break
                    const answer = Survey.Helper.getEmptyAnswerForQuestion(data.question)
                    await provider.pushAnswerToCache(this.user, answer)
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

                case this.text.surveyQuestionMedia.buttonEdit: {
                    if (data.mediaGroupBuffer.isEmpty) break
                    await this.ddi.sendHtml(
                        this.text.surveyQuestionMedia.textEditMode,
                        super.keyboardMarkupWithAutoLayoutFor([
                            ...Array.range(1, data.mediaGroupBuffer.length).map((x) => `${x}`),
                            this.text.surveyQuestionMedia.buttonEditModeExit,
                        ])
                    )
                    return this.completion.inProgress(data)
                }

                case this.text.surveyQuestionMedia.textDeleteAllFiles: {
                    if (data.mediaGroupBuffer.isEmpty) break
                    data.mediaGroupBuffer = []
                    await this.showMediaUploadingMenu(data)
                    return this.completion.inProgress(data)
                }

                case this.text.surveyQuestionMedia.buttonEditModeExit: {
                    await this.showMediaUploadingMenu(data)
                    return this.completion.inProgress(data)
                }

                case this.text.surveyQuestionMedia.buttonDone: {
                    if (data.mediaGroupBuffer.isEmpty) break

                    await provider.pushAnswerToCache(this.user, {
                        type: data.question.type,
                        question: data.question,
                        media: data.mediaGroupBuffer.map((mediaGroupElement) => {
                            return {
                                telegramFileId: mediaGroupElement.telegramFileId,
                                telegramFileUniqueId: mediaGroupElement.telegramFileUniqueId,
                                fileType: mediaGroupElement.fileType,
                            }
                        }),
                    } as Survey.PassedAnswer)
                    return this.completion.complete({
                        sceneName: 'survey',
                        providerType: data.providerType,
                        allowContinueQuestion: false,
                    })
                }

                default:
                    break
            }
        }

        // Handling delete requests for media in edit mode.
        if (ctx.message.type === 'text') {
            const mediaIndex = parseInt(ctx.message.text)
            if (
                !mediaIndex ||
                Number.isNaN(mediaIndex) ||
                mediaIndex > data.mediaGroupBuffer.length ||
                mediaIndex < 1
            ) {
                return this.completion.canNotHandle()
            }
            data.mediaGroupBuffer.splice(mediaIndex - 1, 1)
            await this.showMediaUploadingMenu(data)

            return this.completion.inProgress(data)
        }

        // Handling media files uploaded by the user.
        const contextMedia = this.getMediaFromContext(ctx).filter((mediaFile) => {
            switch (data.question.type) {
                case 'image':
                    return mediaFile.fileType === 'photo'
                case 'singleImage':
                    return mediaFile.fileType === 'photo'
                case 'video':
                    return mediaFile.fileType === 'video'
                case 'mediaGroup':
                    return true
            }
        })
        if (contextMedia.isNotEmpty && data.question.maxCount >= data.mediaGroupBuffer.length) {
            for (const newMediaFile of contextMedia) {
                if (data.question.maxCount === data.mediaGroupBuffer.length) break
                data.mediaGroupBuffer.push(newMediaFile)
            }
            await this.showMediaUploadingMenu(data)
            return this.completion.inProgress(data)
        }

        // If none of the cases match, indicate that the handler cannot process the data.
        return this.completion.canNotHandle()
    }

    // =====================
    // Private methods
    // =====================

    private async showMediaUploadingMenu(data: ISceneData) {
        // Extracting media group information.
        const mediaGroupArgs = data.mediaGroupBuffer.map((item) => ({
            type: item.fileType,
            media: item.telegramFileId,
        }))

        // Initializing buttons array.
        const buttons = []

        // Sending media group if available.
        if (mediaGroupArgs.length > 0) {
            await this.ddi.sendMediaGroup({
                media: mediaGroupArgs,
            })
            buttons.push(
                this.text.surveyQuestionMedia.buttonDone,
                this.text.surveyQuestionMedia.buttonEdit,
                this.text.surveyQuestionMedia.textDeleteAllFiles
            )
        }

        // Adding skip button if question is optional.
        if (data.question.isRequired === false) {
            buttons.push(this.text.survey.buttonOptionalQuestionSkip)
        }

        // Adding back button if not the first question.
        if (data.allowBackToPreviousQuestion) {
            buttons.push(this.text.survey.buttonBackToPreviousQuestion)
        }

        // Composing message text with media count information.
        const messageText = `${data.question.questionText}\n\n<i>${this.text.surveyQuestionMedia.textFilesCountPrefix} <b>${mediaGroupArgs.length}/${data.question.maxCount}</b></i>`

        // Sending the message with appropriate buttons layout.
        await this.ddi.sendMediaContent(data.question.media)
        await this.ddi.sendHtml(
            messageText,
            buttons.isEmpty
                ? Markup.removeKeyboard()
                : super.keyboardMarkupWithAutoLayoutFor(buttons)
        )
    }

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

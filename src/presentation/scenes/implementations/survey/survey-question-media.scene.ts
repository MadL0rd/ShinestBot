import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Message, Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import {
    Survey,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { SurveyDataProviderType } from 'src/presentation/survey-data-provider/models/survey-data-provider.interface'
import { SurveyDataProviderFactoryService } from 'src/presentation/survey-data-provider/survey-provider-factory/survey-provider-factory.service'

// =====================
// Scene data classes
// =====================
export class SurveyQuestionMediaSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyQuestionMedia'
    readonly provider: SurveyDataProviderType.Union
    readonly question: Survey.QuestionMedia
    readonly isQuestionFirst: boolean
}
type SceneEnterDataType = SurveyQuestionMediaSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType.Union
    readonly question: Survey.QuestionMedia
    readonly isQuestionFirst: boolean
    mediaGroupBuffer: Survey.TelegramFileData[]
}
interface MediaGroupContext {
    mediaGroup: Message[]
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyQuestionMediaScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyQuestionMedia'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyDataProviderFactoryService
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
        await this.logToUserHistory(this.historyEvent.startSceneSurveyQuestionMedia)

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }

        const sceneData: ISceneData = {
            provider: data.provider,
            question: data.question,
            isQuestionFirst: data.isQuestionFirst,
            mediaGroupBuffer: [],
        }
        await this.showMediaUploadingMenu(ctx, sceneData)

        return this.completion.inProgress(sceneData)
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        // Logging the scene's handling process.
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        // Restoring data and checking for corruption.
        const data = this.restoreData(dataRaw)
        if (!data || !data.provider || !data.question) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        // Retrieving the appropriate provider based on the data.
        const provider = this.dataProviderFactory.getSurveyProvider(data.provider)

        // Handling various user inputs based on message text.
        if (ctx.message && 'text' in ctx.message) {
            switch (ctx.message.text) {
                case this.text.survey.buttonOptionalQuestionSkip: {
                    if (data.question.isRequired) break
                    const answer = SurveyUsageHelpers.getEmptyAnswerForQuestion(data.question)
                    await provider.pushAnswerToCache(this.user, answer)
                    return this.completion.complete({
                        sceneName: 'survey',
                        provider: data.provider,
                        allowContinueQuestion: false,
                    })
                }

                case this.text.survey.buttonBackToPreviousQuestion: {
                    await provider.popAnswerFromCache(this.user)
                    return this.completion.complete({
                        sceneName: 'survey',
                        provider: data.provider,
                        allowContinueQuestion: false,
                    })
                }

                case this.text.surveyQuestionMedia.buttonEdit: {
                    if (data.mediaGroupBuffer.isEmpty) break
                    await ctx.replyWithHTML(
                        this.text.surveyQuestionMedia.textEditMode,
                        super.keyboardMarkupWithAutoLayoutFor([
                            ...Array.range(1, data.mediaGroupBuffer.length).map((x) => `${x}`),
                            this.text.surveyQuestionMedia.buttonEditModeExit,
                        ])
                    )
                    return this.completion.inProgress(data)
                }

                case this.text.surveyQuestionMedia.buttonEditModeExit: {
                    await this.showMediaUploadingMenu(ctx, data)
                    return this.completion.inProgress(data)
                }

                case this.text.surveyQuestionMedia.buttonDone: {
                    if (data.mediaGroupBuffer.isEmpty) break
                    const mediasWithUrlPromises = await data.mediaGroupBuffer.map(
                        async (mediaGroupElement) => {
                            return await this.getFileLink(
                                ctx,
                                mediaGroupElement.telegramFileId,
                                mediaGroupElement.fileType
                            )
                        }
                    )
                    const mediasWithUrl = await Promise.all(mediasWithUrlPromises)
                    await provider.pushAnswerToCache(this.user, {
                        type: data.question.type,
                        question: data.question,
                        media: mediasWithUrl.compact,
                    } as Survey.PassedAnswer)
                    return this.completion.complete({
                        sceneName: 'survey',
                        provider: data.provider,
                        allowContinueQuestion: false,
                    })
                }
            }
        }

        // Handling delete requests for media in edit mode.
        if (ctx.message && 'text' in ctx.message) {
            const mediaIndex = parseInt(ctx.message.text)
            if (
                !mediaIndex ||
                Number.isNaN(mediaIndex) ||
                mediaIndex > data.mediaGroupBuffer.length ||
                mediaIndex < 1
            ) {
                return this.completion.canNotHandle(data)
            }
            data.mediaGroupBuffer.splice(mediaIndex - 1, 1)
            await this.showMediaUploadingMenu(ctx, data)

            return this.completion.inProgress(data)
        }

        // Handling media files uploaded by the user.
        const contextMedia = this.getMediaFromContext(ctx).filter((mediaFile) => {
            switch (data.question.type) {
                case 'image':
                    return mediaFile.fileType == 'photo'
                case 'video':
                    return mediaFile.fileType == 'video'
                case 'mediaGroup':
                    return true
            }
        })
        if (
            contextMedia.isNotEmpty &&
            data.question.mediaMaxCount >= data.mediaGroupBuffer.length
        ) {
            for (const newMediaFile of contextMedia) {
                if (data.question.mediaMaxCount == data.mediaGroupBuffer.length) break
                data.mediaGroupBuffer.push(newMediaFile)
            }
            await this.showMediaUploadingMenu(ctx, data)
            return this.completion.inProgress(data)
        }

        // If none of the cases match, indicate that the handler cannot process the data.
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

    private async showMediaUploadingMenu(ctx: Context<Update>, data: ISceneData) {
        // Extracting media group information.
        const mediaGroupArgs = data.mediaGroupBuffer.map((item) => ({
            type: item.fileType,
            media: item.telegramFileId,
        }))

        // Initializing buttons array.
        const buttons = []

        // Sending media group if available.
        if (mediaGroupArgs.length > 0) {
            await ctx.replyWithMediaGroup(mediaGroupArgs)
            buttons.push(
                this.text.surveyQuestionMedia.buttonDone,
                this.text.surveyQuestionMedia.buttonEdit
            )
        }

        // Adding skip button if question is optional.
        if (data.question.isRequired == false) {
            buttons.push(this.text.survey.buttonOptionalQuestionSkip)
        }

        // Adding back button if not the first question.
        if (data.isQuestionFirst == false) {
            buttons.push(this.text.survey.buttonBackToPreviousQuestion)
        }

        // Composing message text with media count information.
        const messageText = `${data.question.questionText}\n\n<i>${this.text.surveyQuestionMedia.textFilesCountPrefix} <b>${mediaGroupArgs.length}/${data.question.mediaMaxCount}</b></i>`

        // Sending the message with appropriate buttons layout.
        await ctx.replyWithHTML(
            messageText,
            buttons.length == 0
                ? Markup.removeKeyboard()
                : super.keyboardMarkupWithAutoLayoutFor(buttons)
        )
    }

    private async getFileLink(
        ctx: Context<Update>,
        telegramFileId: string,
        fileType: 'photo' | 'video'
    ): Promise<Survey.TelegramFileData | undefined> {
        if (telegramFileId) {
            const fileUrl = await ctx.telegram.getFileLink(telegramFileId)
            const fileUrlStr = fileUrl.toString()
            return { telegramFileId: telegramFileId, telegramUrl: fileUrlStr, fileType: fileType }
        }
        return undefined
    }

    private getMediaFromContext(ctx: Context): Survey.TelegramFileData[] {
        // Casting to MediaGroupContext to access media group.
        const mediaGroupCtx = ctx as unknown as MediaGroupContext
        const contextMedia: Survey.TelegramFileData[] = []

        // Checking if context contains media group.
        if (mediaGroupCtx && mediaGroupCtx.mediaGroup) {
            // Looping through media group messages to extract media.
            for (const mediaMessage of mediaGroupCtx.mediaGroup) {
                const mediaGroupItem = this.getFileIdAndType(mediaMessage)
                if (mediaGroupItem) contextMedia.push(mediaGroupItem)
            }
        } else {
            // If not media group, extract media from message directly.
            const mediaItem = this.getFileIdAndType(ctx.message)
            if (mediaItem) {
                contextMedia.push(mediaItem)
            }
        }
        return contextMedia
    }

    private getFileIdAndType(message: Message | undefined): Survey.TelegramFileData | undefined {
        const photoMessage = message as Message.PhotoMessage
        const photo = photoMessage?.photo?.last
        if (photo) {
            return {
                fileType: 'photo',
                telegramFileId: photo.file_id,
            }
        }

        const videoMessage = message as Message.VideoMessage
        if (videoMessage && videoMessage.video) {
            return {
                fileType: 'video',
                telegramFileId: videoMessage.video.file_id,
            }
        }
    }
}

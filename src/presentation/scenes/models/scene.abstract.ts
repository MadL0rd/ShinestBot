import { logger } from 'src/app/app.logger'
import { UserHistoryEvent } from 'src/business-logic/user/enums/user-history-event.enum'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { Context, Markup } from 'telegraf'
import {
    Update,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    InputMediaPhoto,
    InputMediaVideo,
    InputMediaAudio,
    InputMediaDocument,
    InlineKeyboardButton,
    KeyboardButton,
} from 'telegraf/types'
import { SceneEntrance } from './scene-entrance.interface'
import { SceneName } from './scene-name.enum'
import { SceneUsagePermissionsValidator } from './scene-usage-permissions-validator'
import {
    IScene,
    SceneUserContext,
    PermissionsValidationResult,
    SceneHandlerCompletion,
} from './scene.interface'
import { SceneCallbackData } from './scene-callback'
import { InlineButtonDto, generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import { UserProfile } from 'src/entities/user-profile'
import { BotContent } from 'src/entities/bot-content'

export abstract class Scene<SceneDataType extends object, SceneEnterDataType extends object>
    implements IScene
{
    // =====================
    // Private properties
    // =====================
    private _content: BotContent.BaseType
    private _text: BotContent.UniqueMessage
    private _user: UserProfileDocument
    private _userActivePermissions: UserProfile.PermissionNames.Union[]

    // =====================
    // Protected properties:
    // syntactic sugar
    // =====================
    protected readonly completion = new SceneHandlerCompletionTemplates<SceneDataType>()
    protected readonly historyEvent = UserHistoryEvent

    protected get user(): UserProfileDocument {
        return this._user
    }
    protected get userActivePermissions(): UserProfile.PermissionNames.Union[] {
        return this._userActivePermissions
    }
    protected get content(): BotContent.BaseType {
        return this._content
    }
    protected get text(): BotContent.UniqueMessage {
        return this._text
    }

    // =====================
    // Abstract properties
    // =====================
    readonly name: SceneName.Union
    protected readonly userService: UserService
    protected get dataDefault(): SceneDataType {
        return {} as SceneDataType
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    // =====================
    // IScene methods
    // =====================
    injectUserContext(userContext: SceneUserContext) {
        this._content = userContext.botContent
        this._text = userContext.botContent.uniqueMessage
        this._user = userContext.user
        this._userActivePermissions = userContext.userActivePermissions
        this._text = userContext.botContent.uniqueMessage
        return this
    }

    validateUseScenePermissions(): PermissionsValidationResult {
        const validator = this.permissionsValidator
        return validator.validateUseScenePermissions(this.userActivePermissions, this.text)
    }

    handleEnterScene(ctx: Context, data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }
    handleMessage(ctx: Context, data: SceneDataType): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }
    handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Methods:
    // syntactic sugar
    // =====================

    protected generateData(data: SceneDataType | null): SceneDataType {
        return data ?? this.dataDefault
    }

    protected restoreData(dataRaw: object): SceneDataType {
        const data: SceneDataType = dataRaw as SceneDataType
        return data ?? this.dataDefault
    }

    protected keyboardMarkupFor(
        keyboard: string[][]
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        if (keyboard.length == 0) {
            return Markup.removeKeyboard()
        }
        return Markup.keyboard(keyboard).resize()
    }

    protected keyboardMarkupWithAutoLayoutFor(
        keyboard: KeyboardButton[],
        twoColumnsForce: boolean = false
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        if (keyboard.length == 0) return Markup.removeKeyboard()

        let keyboardWithAutoLayout: KeyboardButton[][]

        if (keyboard.length < 5 && !twoColumnsForce) {
            // For short keyboards place 1 button on every row
            keyboardWithAutoLayout = keyboard.map((button) => [button])
        } else {
            // For long keyboards place 2 button on every row
            keyboardWithAutoLayout = [[]]
            keyboard.forEach((button) => {
                if (keyboardWithAutoLayout[keyboardWithAutoLayout.length - 1].length === 2) {
                    keyboardWithAutoLayout.push([button])
                } else {
                    keyboardWithAutoLayout[keyboardWithAutoLayout.length - 1].push(button)
                }
            })
        }
        return Markup.keyboard(keyboard).resize()
    }

    protected async logToUserHistory<EventName extends UserHistoryEvent.EventTypeName>(
        event: UserHistoryEvent.SomeEventType<EventName>
    ) {
        await this.userService.logToUserHistory(this.user, event)
    }

    protected async replyMediaContent(
        ctx: Context<Update>,
        media: BotContent.OnboardingPage.MediaContent.BaseType,
        separatedContentType: null | 'images' | 'videos' | 'audio' | 'docks' = null
    ): Promise<void> {
        // Media group
        const mediaGroupArgs: (InputMediaPhoto | InputMediaVideo)[] = []
        if (!separatedContentType || separatedContentType == 'videos') {
            media.videos.forEach((url) =>
                mediaGroupArgs.push({
                    type: 'video',
                    media: url,
                })
            )
        }

        if (!separatedContentType || separatedContentType == 'images') {
            media.images.forEach((url) =>
                mediaGroupArgs.push({
                    type: 'photo',
                    media: url,
                })
            )
        }

        if (mediaGroupArgs.length > 0) {
            try {
                await ctx.replyWithMediaGroup(mediaGroupArgs)
            } catch (error) {
                logger.error(
                    `Fail to reply with media group (photo, video) ${JSON.stringify(
                        mediaGroupArgs
                    )}`,
                    error
                )
            }
        }

        if (!separatedContentType || separatedContentType == 'audio') {
            const audioGroupArgs: InputMediaAudio[] = []
            media.audio.forEach((url) =>
                audioGroupArgs.push({
                    type: 'audio',
                    media: url,
                })
            )

            if (audioGroupArgs.length > 0) {
                try {
                    await ctx.replyWithMediaGroup(audioGroupArgs)
                } catch (error) {
                    logger.error(
                        `Fail to reply with media group (audio) ${JSON.stringify(audioGroupArgs)}`,
                        error
                    )
                }
            }
        }

        if (!separatedContentType || separatedContentType == 'docks') {
            const docsGroupArgs: InputMediaDocument[] = []
            media.documents.forEach((url) =>
                docsGroupArgs.push({
                    type: 'document',
                    media: url,
                })
            )

            if (docsGroupArgs.length > 0) {
                try {
                    await ctx.replyWithMediaGroup(docsGroupArgs)
                } catch (error) {
                    logger.error(
                        `Fail to reply with media group (document) ${JSON.stringify(
                            docsGroupArgs
                        )}`,
                        error
                    )
                }
            }
        }
    }

    /**
     * Max callback data size is 64 chars in UTF-8
     * MongoDB id length: 24
     */
    protected inlineButton(button: InlineButtonDto): InlineKeyboardButton {
        return generateInlineButton(button, this.name)
    }

    protected async completeAndSendErrorMessage(ctx: Context<Update>, errorMessage?: string) {
        await ctx.replyWithHTML(errorMessage ?? this.text.common.errorMessage)
        return this.completion.complete()
    }
}

class SceneHandlerCompletionTemplates<SceneDataType extends object> {
    canNotHandle(data: SceneDataType): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: false,
            sceneData: data ?? ({} as SceneDataType),
        }
    }

    canNotHandleUnsafe(): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: false,
            sceneData: {} as SceneDataType,
        }
    }

    inProgress(data: SceneDataType): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: true,
            sceneData: data ?? ({} as SceneDataType),
        }
    }

    complete(enterSceneDto?: SceneEntrance.SomeSceneDto): SceneHandlerCompletion {
        return {
            inProgress: false,
            didHandledUserInteraction: true,
            nextSceneIfCompleted: enterSceneDto,
        }
    }

    completeWithUnsafeSceneEntrance(sceneName: SceneName.Union): SceneHandlerCompletion {
        return {
            inProgress: false,
            didHandledUserInteraction: true,
            nextSceneIfCompleted: { sceneName: sceneName } as any,
        }
    }
}

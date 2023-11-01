import { Context, Telegraf } from 'telegraf'
import { SceneName } from './enums/scene-name.enum'
import {
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
} from 'telegraf/typings/core/types/typegram'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { UserDocument, UserPermission } from 'src/core/user/schemas/user.schema'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { BotContent } from 'src/core/bot-content/schemas/bot-content.schema'
import { UserService } from 'src/core/user/user.service'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'
import { UniqueMessage } from 'src/core/bot-content/schemas/models/bot-content.unique-message'
import { BotContentService } from 'src/core/bot-content/bot-content.service'
import { MediaContent } from 'src/core/bot-content/schemas/models/bot-content.media-content'
import { SceneCallbackAction } from './enums/scene-callback-action.enum'
import { LocalizationService } from 'src/core/localization/localization.service'

export interface IScene {
    readonly name: SceneName

    validateUseScenePermissions(): PermissionsValidationResult
    handleEnterScene(ctx: Context): Promise<SceneHandlerCompletion>
    handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion>
    handleCallback(ctx: Context, dataRaw: SceneCallbackData): Promise<SceneHandlerCompletion>

    // Notes:
    // 1. completion.nextSceneNameIfCompleted must be null after call handleEnterScene
}

export interface SceneHandlerCompletion {
    /** True means that next user message should be handled by the same scene */
    inProgress: boolean
    /** False means that scene still in progress, but user sent an incorrect message */
    didHandledUserInteraction: boolean
    /** Scene data to save for next message from user */
    sceneData?: object
    /** This field can bring content only if inProgress is false */
    nextSceneNameIfCompleted?: SceneName
}

export interface PermissionsValidationResult {
    canUseScene: boolean
    validationErrorMessage?: string
}

export interface ISceneConfigurationData {
    readonly bot: Telegraf<Context>
    readonly user: UserDocument
    readonly botContent: BotContent
    readonly userService: UserService
    readonly botContentService: BotContentService
    readonly localizationService: LocalizationService
    readonly userActivePermissions: UserPermissions[]
}

export class Scene<SceneDataType extends object> implements IScene {
    readonly name: SceneName
    readonly completion = new SceneHandlerCompletionTemplates<SceneDataType>()
    readonly historyEvent = UserHistoryEvent
    get dataDefault(): SceneDataType {
        return {} as SceneDataType
    }

    public readonly content: BotContent
    public readonly text: UniqueMessage
    public readonly user: UserDocument
    public readonly userActivePermissions: UserPermissions[]
    public readonly userService: UserService
    public readonly bot: Telegraf<Context>
    public readonly botContentService: BotContentService
    public readonly localizationService: LocalizationService

    constructor(readonly configuration: ISceneConfigurationData) {
        this.bot = configuration.bot
        this.content = configuration.botContent
        this.text = configuration.botContent.uniqueMessage
        this.user = configuration.user
        this.userActivePermissions = configuration.userActivePermissions
        this.userService = configuration.userService
        this.botContentService = configuration.botContentService
        this.text = configuration.botContent.uniqueMessage
        this.localizationService = configuration.localizationService
    }

    validateUseScenePermissions(): PermissionsValidationResult {
        if (this.userActivePermissions === null || this.userActivePermissions.length === 0) {
            return { canUseScene: true }
        }
        if (this.userActivePermissions.includes(UserPermissions.banned)) {
            return {
                canUseScene: false,
                validationErrorMessage: this.text.common.bannedUserMessage,
            }
        }
        return { canUseScene: true }
    }

    handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }
    handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }
    handleCallback(
        ctx: Context<Update>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    generateData(data: SceneDataType | null): SceneDataType {
        return data ?? this.dataDefault
    }

    restoreData(dataRaw: object): SceneDataType {
        const data: SceneDataType = dataRaw as SceneDataType
        return data ?? this.dataDefault
    }

    keyboardMarkupFor(
        keyboard: string[][]
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        if (keyboard.length == 0) {
            return Markup.removeKeyboard()
        }
        return Markup.keyboard(keyboard).resize()
    }

    keyboardMarkupWithAutoLayoutFor(
        keyboard: string[]
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        keyboard = keyboard.compact
        let keyboardWithAutoLayout: string[][]

        if (keyboard.length < 5) {
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

        return this.keyboardMarkupFor(keyboardWithAutoLayout)
    }

    async logToUserHistory(event: UserHistoryEvent, content?: string): Promise<void> {
        await this.userService.logToUserHistory(this.user, event, content)
    }

    async replyMediaContent(
        ctx: Context<Update>,
        media: MediaContent,
        separatedContentType: null | 'images' | 'videos' | 'audio' | 'docks' = null
    ): Promise<void> {
        // Media group
        const mediaGroupArgs = []
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
            } catch (e) {
                logger.error(e, this.name)
            }
        }

        if (!separatedContentType || separatedContentType == 'audio') {
            const audioGroupArgs = []
            media.audio.forEach((url) =>
                audioGroupArgs.push({
                    type: 'audio',
                    media: url,
                })
            )

            if (audioGroupArgs.length > 0) {
                try {
                    await ctx.replyWithMediaGroup(audioGroupArgs)
                } catch (e) {
                    logger.error(e, this.name)
                }
            }
        }

        if (!separatedContentType || separatedContentType == 'docks') {
            const docsGroupArgs = []
            media.documents.forEach((url) =>
                docsGroupArgs.push({
                    type: 'document',
                    media: url,
                })
            )

            if (docsGroupArgs.length > 0) {
                try {
                    await ctx.replyWithMediaGroup(docsGroupArgs)
                } catch (e) {
                    logger.error(e, this.name)
                }
            }
        }
    }

    /**
     * Max callback data size is 64 chars in UTF-8
     * MongoDB id length: 24
     */
    inlineButton(button: InlineButtonDto): InlineKeyboardButton {
        const callbackData = new SceneCallbackData(
            SceneName.getId(this.name),
            button.action,
            button.data ?? {}
        )
        const callbackDataCompressed = callbackData.toString()
        const inlineButton: InlineKeyboardButton = {
            text: button.text,
            callback_data: callbackDataCompressed,
        }
        if (callbackDataCompressed.length > 64) {
            logger.error(
                `inlineButton callback data length is ${callbackDataCompressed.length} max length is 64`,
                callbackDataCompressed
            )
        }
        return inlineButton
    }
}

interface InlineButtonDto {
    text: string
    action: SceneCallbackAction
    data?: object
}

class SceneHandlerCompletionTemplates<SceneDataType extends object> {
    canNotHandle(data: SceneDataType | null = null): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: false,
            sceneData: data ?? ({} as SceneDataType),
        }
    }

    inProgress(data: SceneDataType | null = null): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: true,
            sceneData: data ?? ({} as SceneDataType),
        }
    }

    complete(nextScene?: SceneName): SceneHandlerCompletion {
        return {
            inProgress: false,
            didHandledUserInteraction: true,
            nextSceneNameIfCompleted: nextScene,
        }
    }
}

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 */
export class SceneCallbackData {
    constructor(
        // sceneName id
        private readonly s: number,
        // action
        private readonly a: SceneCallbackAction,
        // data
        private readonly d: object
    ) {}

    public get sceneName(): SceneName {
        return SceneName.getById(this.s)
    }
    public get action(): SceneCallbackAction {
        return this.a
    }
    public get data(): object {
        return this.d
    }

    toString(): string {
        return JSON.stringify(this)
    }

    toPrettyString(): string {
        return JSON.stringify({
            sceneName: this.sceneName,
            action: SceneCallbackAction[this.action],
            data: this.data,
        })
    }
}

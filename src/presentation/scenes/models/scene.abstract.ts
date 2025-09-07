import { logger } from 'src/app/app.logger'
import { TelegramDirectDialogInteractor } from 'src/business-logic/telegram-bridge/telegram-ddi/telegram-ddi'
import { UserHistoryEvent } from 'src/business-logic/user/enums/user-history-event.enum'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { UserProfile } from 'src/entities/user-profile'
import { generateInlineButton, InlineButtonDto } from 'src/presentation/utils/inline-button.utils'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Markup } from 'telegraf'
import {
    InlineKeyboardButton,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
} from 'telegraf/types'
import { SceneCallbackData } from './scene-callback'
import { SceneEntrance } from './scene-entrance.interface'
import { SceneName } from './scene-name.enum'
import { SceneUsagePermissionsValidator } from './scene-usage-permissions-validator'
import {
    IScene,
    PermissionsValidationResult,
    SceneHandlerCompletion,
    SceneUserContext,
} from './scene.interface'

export abstract class Scene<
    SceneDataType extends Record<string, unknown>,
    SceneEnterDataType extends object,
> implements IScene
{
    // =====================
    // Private properties
    // =====================
    private _content: BotContent.BaseType
    private _text: BotContent.UniqueMessage
    private _user: UserProfileDocument
    private _userActivePermissions: UserProfile.PermissionNames.Union[]
    private _ddi: TelegramDirectDialogInteractor

    // =====================
    // Protected properties:
    // syntactic sugar
    // =====================
    protected readonly completion = new SceneHandlerCompletionTemplates<SceneDataType>()

    protected get user(): UserProfile.BaseType {
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
    protected get ddi() {
        return this._ddi
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
    constructor() {
        const { handleEnterScene, handleMessage, handleCallback } = this
        this.handleEnterScene = (...args: any) => {
            logger.log(
                `${this.name} handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
            )
            this.logToUserHistory({
                type: 'enterScene',
                sceneName: this.name,
                sceneEntranceDto: args[0],
            })
            return handleEnterScene.apply(this, args)
        }
        this.handleMessage = (...args: any) => {
            logger.log(
                `${this.name} handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
            )
            return handleMessage.apply(this, args)
        }
        this.handleCallback = (...args: any) => {
            logger.log(
                `${this.name} handleCallback. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
            )
            return handleCallback.apply(this, args)
        }
    }

    injectUserContext(userContext: SceneUserContext) {
        this._content = userContext.botContent
        this._text = userContext.botContent.uniqueMessage
        this._user = userContext.user
        this._userActivePermissions = userContext.userActivePermissions
        this._text = userContext.botContent.uniqueMessage
        this._ddi = userContext.ddi
        return this
    }

    validateUseScenePermissions(): PermissionsValidationResult {
        const validator = this.permissionsValidator
        return validator.validateUseScenePermissions(this.userActivePermissions, this.text)
    }

    handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }
    handleMessage(
        ctx: ExtendedMessageContext,
        data: SceneDataType
    ): Promise<SceneHandlerCompletion> {
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

    protected restoreData(dataRaw: unknown): SceneDataType {
        const data: SceneDataType = dataRaw as SceneDataType
        return data ?? this.dataDefault
    }

    protected keyboardMarkup(
        keyboard: ((KeyboardButton | null)[] | KeyboardButton | null)[]
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        const keyboardResult = keyboard.compact
            .map((buttonOrLine) =>
                buttonOrLine instanceof Array
                    ? buttonOrLine.compact
                    : buttonOrLine
                      ? [buttonOrLine]
                      : []
            )
            .filter((buttonsLine) => buttonsLine.isNotEmpty)
        return keyboardResult.isNotEmpty
            ? Markup.keyboard(keyboardResult).resize()
            : Markup.removeKeyboard()
    }

    protected keyboardMarkupWithAutoLayoutFor(
        keyboard: KeyboardButton[],
        args?: { columnsCount?: 1 | 2 }
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        if (keyboard.isEmpty) return Markup.removeKeyboard()

        let keyboardWithAutoLayout: KeyboardButton[][]

        const columnsCount = (args?.columnsCount ?? keyboard.length < 5) ? 1 : 2
        if (columnsCount === 1) {
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
        return Markup.keyboard(keyboardWithAutoLayout).resize()
    }

    protected async logToUserHistory<EventName extends UserHistoryEvent.EventTypeName>(
        event: UserHistoryEvent.SomeEventType<EventName>
    ) {
        this.userService.logToUserHistory(this.user, event)
    }

    /**
     * Max callback data size is 64 chars in UTF-8
     * MongoDB id length: 24
     */
    protected inlineButton(button: InlineButtonDto): InlineKeyboardButton {
        return generateInlineButton(button, this.name)
    }

    protected async completeAndSendErrorMessage(errorMessage?: string) {
        await this.ddi.sendHtml(errorMessage ?? this.text.common.errorMessage)
        return this.completion.complete()
    }
}

class SceneHandlerCompletionTemplates<SceneDataType extends Record<string, unknown>> {
    canNotHandle(args?: { didAlreadySendErrorMessage: true }): SceneHandlerCompletion {
        return {
            type: 'doNothing',
            didHandledUserInteraction: false,
            didAlreadySendErrorMessage: args?.didAlreadySendErrorMessage ?? false,
        }
    }

    doNothing(): SceneHandlerCompletion {
        return {
            type: 'doNothing',
            didHandledUserInteraction: true,
            didAlreadySendErrorMessage: false,
        }
    }

    inProgress(data: SceneDataType): SceneHandlerCompletion {
        return {
            type: 'inProgress',
            sceneData: data,
        }
    }

    complete(enterSceneDto?: SceneEntrance.SomeSceneDto): SceneHandlerCompletion {
        return {
            type: 'transition',
            nextScene: enterSceneDto,
        }
    }
}

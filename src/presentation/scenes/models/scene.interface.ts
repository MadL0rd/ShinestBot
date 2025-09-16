import { TelegramDirectDialogInteractor } from 'src/business-logic/telegram-bridge/telegram-ddi/telegram-ddi'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { BotContent } from 'src/entities/bot-content'
import { UserProfile } from 'src/entities/user-profile'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from './scene-callback'
import { SceneEntrance } from './scene-entrance.interface'
import { SceneName } from './scene-name.enum'

export interface IScene {
    readonly name: SceneName.Union

    injectUserContext(userContext: SceneUserContext): IScene
    validateUseScenePermissions(): PermissionsValidationResult
    handleEnterScene(data?: object): Promise<SceneHandlerCompletion>
    handleMessage(ctx: ExtendedMessageContext, data: object): Promise<SceneHandlerCompletion>
    handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion>
}

export type SceneHandlerCompletion =
    | SceneHandlerCompletionInProgress
    | SceneHandlerCompletionDoNothing
    | SceneHandlerCompletionTransition

export type SceneHandlerCompletionInProgress = {
    type: 'inProgress'
    sceneData?: Record<string, unknown>
}
export type SceneHandlerCompletionDoNothing = {
    type: 'doNothing'
    didHandledUserInteraction: boolean
    didAlreadySendErrorMessage: boolean
}
export type SceneHandlerCompletionTransition = {
    type: 'transition'
    nextScene?: SceneEntrance.AnySceneDto
}

export interface PermissionsValidationResult {
    canUseScene: boolean
    validationErrorMessage?: string
}

/**
 * @field user
 * Service internal user model
 *
 * @field userAccessRules
 * User permissions validated by current date and time
 * and converted to access rules
 *
 * @field botContent
 * Value of all remote content localized by user language
 *
 * @field ddi
 * Direct dialog interactor (api wrapper for all interactions with private chat with user)
 */
export interface SceneUserContext {
    readonly user: UserProfileDocument
    readonly userAccessRules: UserProfile.AccessRules
    readonly botContent: BotContent.BaseType
    readonly ddi: TelegramDirectDialogInteractor
}

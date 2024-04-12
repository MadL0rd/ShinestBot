import { Context } from 'telegraf'
import { SceneName } from './scene-name.enum'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from './scene-callback'
import { SceneEntrance } from './scene-entrance.interface'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserProfile } from 'src/entities/user-profile'
import { BotContent } from 'src/entities/bot-content'

export interface IScene {
    readonly name: SceneName.Union

    injectUserContext(userContext: SceneUserContext): IScene
    validateUseScenePermissions(): PermissionsValidationResult
    handleEnterScene(ctx: Context, data?: object): Promise<SceneHandlerCompletion>
    handleMessage(ctx: Context, data: object): Promise<SceneHandlerCompletion>
    handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion>
}

/**
 * @field inProgress
 * True means that next user message should be handled by the same scene
 *
 * @field didHandledUserInteraction
 * False means that scene still in progress, but user sent an incorrect message
 *
 * @field sceneData
 * Scene data to save for next message from user
 *
 * @field nextSceneIfCompleted
 * This field can bring content only if `inProgress` is false
 */
export interface SceneHandlerCompletion {
    /** True means that next user message should be handled by the same scene */
    inProgress: boolean
    /** False means that scene still in progress, but user sent an incorrect message */
    didHandledUserInteraction: boolean
    /** Scene data to save for next message from user */
    sceneData?: any
    /** This field can bring content only if inProgress is false */
    nextSceneIfCompleted?: SceneEntrance.AnySceneDto
}

export interface PermissionsValidationResult {
    canUseScene: boolean
    validationErrorMessage?: string
}

/**
 * @field user
 * Servise internal user model
 *
 * @field userActivePermissions
 * User permissions validated by current date and time
 *
 * @field botContent
 * Value of all remote content localized by user language
 */
export interface SceneUserContext {
    readonly user: UserProfileDocument
    readonly userActivePermissions: UserProfile.PermissionNames.Union[]
    readonly botContent: BotContent.BaseType
}

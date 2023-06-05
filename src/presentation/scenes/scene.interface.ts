import { Context } from 'telegraf'
import { SceneName } from './enums/scene-name.enum'
import { Update } from 'telegraf/typings/core/types/typegram'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { UserDocument, UserPermission } from 'src/core/user/schemas/user.schema'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { BotContent } from 'src/core/bot-content/schemas/bot-content.schema'
import { UserService } from 'src/core/user/user.service'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'

export interface IScene {
    readonly name: SceneName

    validateUseScenePermissions(permissions: UserPermissions[]): PermissionsValidationResult
    handleEnterScene(ctx: Context): Promise<SceneHandlerCompletion>
    handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion>
    handleCallback(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion>

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

export class Scene implements IScene {
    readonly name: SceneName
    readonly completion = SceneHandlerCompletionTemplates
    readonly historyEvent = UserHistoryEvent

    constructor(
        public readonly content: BotContent,
        public readonly user: UserDocument,
        public readonly userService: UserService,
    ) {}

    validateUseScenePermissions(permissions: UserPermissions[]): PermissionsValidationResult {
        if (permissions === null || permissions.length === 0) {
            return {
                canUseScene: true,
            }
        }
        if (permissions.find(permission => permission === UserPermissions.banned)) {
            return {
                canUseScene: false,
                validationErrorMessage: 'You are banned from using this scene',
            }
        }
        return {
            canUseScene: true,
        }
    }

    handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }
    handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }
    handleCallback(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    keyboardMarkupFor(keyboard: string[][]): object {
        return Markup.keyboard(keyboard).resize()
    }

    keyboardMarkupWithAutoLayoutFor(keyboard: string[]): object {
        let keyboardWithAutoLayout: string[][]

        if (keyboard.length < 5) {
            // For short keyboards place 1 button on every row
            keyboardWithAutoLayout = keyboard.map((button) => [button])
        } else {
            // For long keyboards place 2 button on every row
            keyboardWithAutoLayout = [[]]
            logger.log(keyboardWithAutoLayout)
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
}

class SceneHandlerCompletionTemplates {
    static canNotHandle(data: object): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: false,
            sceneData: data,
        }
    }

    static inProgress(data: object): SceneHandlerCompletion {
        return {
            inProgress: true,
            didHandledUserInteraction: true,
            sceneData: data,
        }
    }

    static complete(nextScene?: SceneName): SceneHandlerCompletion {
        return {
            inProgress: false,
            didHandledUserInteraction: true,
            nextSceneNameIfCompleted: nextScene,
        }
    }
}

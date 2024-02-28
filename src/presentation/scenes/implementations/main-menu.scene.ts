import { logger } from 'src/app.logger'
import { UserService } from 'src/core/user/user.service'
import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/types'
import {
    SceneCallbackData,
    SceneCallbackAction,
    SceneCallbackDataSegue,
} from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class MainMenuSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'mainMenu'
}
type SceneEnterDataType = MainMenuSceneEntranceDto
interface ISceneData {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class MainMenuScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'mainMenu'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(protected readonly userService: UserService) {
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
        await this.logToUserHistory(this.historyEvent.startSceneMainMenu)

        await ctx.replyWithHTML(this.text.mainMenu.text, this.menuMarkup())

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message as Message.TextMessage

        switch (message?.text) {
            case this.text.mainMenu.buttonRepoLink:
                await ctx.replyWithHTML(this.text.mainMenu.textRepoLink)
                return this.completion.inProgress({})

            case this.text.mainMenu.buttonLanguageSettings:
                return this.completion.complete({ sceneName: 'onboarding' })

            case this.text.mainMenu.buttonAdminMenu:
                return this.completion.complete({
                    sceneName: 'mainMenu',
                })
        }

        return this.completion.canNotHandle({})
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        switch (data.action) {
            case SceneCallbackAction.segueButton:
                const callbackData = data.data as SceneCallbackDataSegue

                const nextScene = SceneName.castToInstance(callbackData.segueSceneName)
                if (!nextScene) return this.completion.canNotHandle({})

                return this.completion.completeWithUnsafeSceneEntrance(nextScene)
        }
        return this.completion.canNotHandle({})
    }

    // =====================
    // Private methods
    // =====================

    private menuMarkup(): object {
        const ownerOrAdmin =
            this.userActivePermissions.includes('admin') ||
            this.userActivePermissions.includes('owner')
        return this.keyboardMarkupWithAutoLayoutFor(
            [
                this.text.mainMenu.buttonRepoLink,
                this.text.mainMenu.buttonLanguageSettings,
                ownerOrAdmin ? this.text.mainMenu.buttonAdminMenu : null,
            ].compact
        )
    }
}

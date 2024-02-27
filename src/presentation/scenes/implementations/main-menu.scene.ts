import { Context } from 'telegraf'
import { SceneNames } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../scene.interface'
import { logger } from 'src/app.logger'
import { Markup } from 'telegraf'
import { SceneCallbackAction, SceneCallbackDataSegue } from '../enums/scene-callback-action.enum'
import { Message, Update } from 'node_modules/telegraf/typings/core/types/typegram'

// =====================
// Scene data class
// =====================
interface ISceneData {}

export class MainMenuScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneNames.union = 'mainMenu'

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory(this.historyEvent.startSceneMainMenu)

        await ctx.replyWithHTML(this.text.mainMenu.text, this.menuMarkup())

        return this.completion.inProgress()
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message as Message.TextMessage

        switch (message?.text) {
            case this.text.mainMenu.buttonRepoLink:
                await ctx.replyWithHTML(this.text.mainMenu.textRepoLink)
                return this.completion.inProgress()

            case this.text.mainMenu.buttonLanguageSettings:
                return this.completion.complete('languageSettings')

            case this.text.mainMenu.buttonAdminMenu:
                return this.completion.complete('adminMenu')
        }

        return this.completion.canNotHandle()
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        switch (data.action) {
            case SceneCallbackAction.segueButton:
                const callbackData = data.data as SceneCallbackDataSegue

                const nextScene = SceneNames.castToInstance(callbackData.segueSceneName)
                if (!nextScene) return this.completion.canNotHandle()

                return this.completion.complete(nextScene)
        }
        return this.completion.canNotHandle()
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

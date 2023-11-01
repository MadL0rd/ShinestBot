import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../scene.interface'
import { logger } from 'src/app.logger'
import { Markup } from 'telegraf'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'

// =====================
// Scene data class
// =====================
interface ISceneData {}

export class MainMenuScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.mainMenu

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneMainMenu)

        await ctx.replyWithHTML(this.text.mainMenu.text, this.menuMarkup())

        return this.completion.inProgress()
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)
        const message = ctx.message as Message.TextMessage

        switch (message?.text) {
            case this.text.mainMenu.buttonRepoLink:
                await ctx.replyWithHTML(this.text.mainMenu.textRepoLink)
                return this.completion.inProgress()

            case this.text.mainMenu.buttonLanguageSettings:
                return this.completion.complete(SceneName.languageSettings)

            case this.text.mainMenu.buttonAdminMenu:
                return this.completion.complete(SceneName.adminMenu)
        }

        return this.completion.canNotHandle()
    }

    async handleCallback(
        ctx: Context<Update>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private menuMarkup(): object {
        const ownerOrAdmin =
            this.userActivePermissions.includes(UserPermissions.admin) ||
            this.userActivePermissions.includes(UserPermissions.owner)

        return this.keyboardMarkupFor([
            [this.text.mainMenu.buttonRepoLink],
            [this.text.mainMenu.buttonLanguageSettings],
            ownerOrAdmin ? [this.text.mainMenu.buttonAdminMenu] : [],
        ])
    }
}

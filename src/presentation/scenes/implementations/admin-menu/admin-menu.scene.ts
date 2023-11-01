import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../../enums/scene-name.enum'
import {
    PermissionsValidationResult,
    Scene,
    SceneCallbackData,
    SceneHandlerCompletion,
} from '../../scene.interface'
import { logger } from 'src/app.logger'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { PageNameEnum } from 'src/core/google-tables/enums/page-name.enum'

// =====================
// Scene data class
// =====================
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ISceneData {}

export class AdminMenuScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.adminMenu

    // =====================
    // Public methods
    // =====================

    validateUseScenePermissions(): PermissionsValidationResult {
        const ownerOrAdmin =
            this.userActivePermissions.includes(UserPermissions.admin) ||
            this.userActivePermissions.includes(UserPermissions.owner)
        if (ownerOrAdmin) {
            return { canUseScene: true }
        }
        return { canUseScene: false }
    }

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenu)

        await ctx.replyWithHTML(
            `${this.text.adminMenu.text}\n\nVersion: ${process.env.npm_package_version}`,
            this.menuMarkup()
        )
        return this.completion.inProgress(this.generateData({}))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        const data: ISceneData = this.restoreData(dataRaw)

        const message = ctx.message as Message.TextMessage

        switch (message?.text) {
            case this.text.adminMenu.buttonReloadData:
                await this.cacheBotContent(ctx)
                return this.completion.inProgress()

            case this.text.adminMenu.buttonDownloadTables:
                return this.completion.complete(SceneName.adminMenuGenerateMetrix)

            case this.text.adminMenu.buttonUsersManagement:
                return this.completion.complete(SceneName.adminMenuUsersManagement)

            case this.text.adminMenu.buttonMailing:
                return this.completion.complete(SceneName.adminMenuMailing)

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete(SceneName.mainMenu)
        }

        return this.completion.canNotHandle()
    }

    async handleCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ctx: Context<Update>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private async cacheBotContent(ctx: Context<Update>): Promise<void> {
        let messageText = 'Список языков: '
        const languages = await this.localizationService.getRemoteLanguages()
        messageText += languages.join('; ')
        messageText += '\n'

        for (const pageName in PageNameEnum) {
            messageText += `\n🔴 ${PageNameEnum[pageName]}`
        }

        const messageInfo = await ctx.replyWithHTML(messageText)

        for (const pageName in PageNameEnum) {
            await this.botContentService.cacheSpreadsheetPage(PageNameEnum[pageName])
            messageText = messageText.replace('🔴', '🟢')
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                messageInfo.message_id,
                undefined,
                messageText,
                {
                    parse_mode: 'HTML',
                }
            )
        }
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            messageInfo.message_id,
            undefined,
            '❇️ Тексты обновлены',
            {
                parse_mode: 'HTML',
            }
        )
    }

    private menuMarkup(): object {
        return this.keyboardMarkupFor([
            [this.text.adminMenu.buttonReloadData],
            [this.text.adminMenu.buttonDownloadTables],
            [this.text.adminMenu.buttonUsersManagement],
            [this.text.adminMenu.buttonMailing],
            [this.text.common.buttonReturnToMainMenu],
        ])
    }
}

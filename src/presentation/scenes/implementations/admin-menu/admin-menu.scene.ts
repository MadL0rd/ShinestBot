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
import { UserPermissionNamesStable } from 'src/core/user/enums/user-permission.enum'
import { PageNameEnum } from 'src/core/google-tables/enums/page-name.enum'
import { internalConstants } from 'src/app.internal-constants'

// =====================
// Scene data class
// =====================
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ISceneData {}

enum SpreadsheetPageCacheStatus {
    loading = 'loading',
    success = 'success',
    error = 'error',
}

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
            this.userActivePermissions.includes(UserPermissionNamesStable.admin) ||
            this.userActivePermissions.includes(UserPermissionNamesStable.owner)
        if (ownerOrAdmin) {
            return { canUseScene: true }
        }
        return { canUseScene: false }
    }

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenu)

        await ctx.replyWithHTML(
            `${this.text.adminMenu.text}\n\nVersion: <b>${internalConstants.npmPackageVersion}</b>`,
            this.menuMarkup()
        )
        return this.completion.inProgress(this.generateData({}))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        // const data: ISceneData = this.restoreData(dataRaw)

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
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private async cacheBotContent(ctx: Context<Update>): Promise<void> {
        let messagePrefix = 'Список языков: '
        const languages = await this.localizationService.getRemoteLanguages()
        messagePrefix += languages.join('; ')
        messagePrefix += '\n'

        const statuses = new Map<PageNameEnum, SpreadsheetPageCacheStatus | Error>()
        Object.keys(PageNameEnum).forEach(
            (pageName) => (statuses[pageName] = SpreadsheetPageCacheStatus.loading)
        )

        const messageInfo = await ctx.replyWithHTML(
            messagePrefix + this.generageTextForCacheStatuses(statuses)
        )
        const botContentService = this.botContentService
        const loadingPromises = Object.keys(PageNameEnum).map((pageName) => {
            const cacheSpreadsheetFunc = async function (): Promise<void> {
                try {
                    await botContentService.cacheSpreadsheetPage(PageNameEnum[pageName])
                    statuses[pageName] = SpreadsheetPageCacheStatus.success
                } catch (error) {
                    statuses[pageName] = error
                    logger.error(`Fail to cache spreadsheep page ${pageName}`, error)
                }
            }
            return cacheSpreadsheetFunc()
        })
        await Promise.all(loadingPromises)

        if (!ctx.chat) return
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            messageInfo.message_id,
            undefined,
            messagePrefix +
                this.generageTextForCacheStatuses(statuses) +
                '\n\nПроцесс обновления завершен',
            {
                parse_mode: 'MarkdownV2',
            }
        )
    }
    private generageTextForCacheStatuses(
        statuses: Map<PageNameEnum, SpreadsheetPageCacheStatus | Error>
    ): string {
        let result = ''
        for (const pageName in PageNameEnum) {
            result += `\n`
            if (statuses[pageName] instanceof Error) {
                result += `❌ ${PageNameEnum[pageName]}:\n\`\`\`\n${statuses[pageName]}\n\`\`\``
            } else {
                const status: SpreadsheetPageCacheStatus = statuses[pageName]
                switch (status) {
                    case SpreadsheetPageCacheStatus.loading:
                        result += '🔍'
                        break
                    case SpreadsheetPageCacheStatus.success:
                        result += '🟢'
                        break
                    case SpreadsheetPageCacheStatus.error:
                        result += '❌'
                        break
                }
                result += PageNameEnum[pageName]
            }
        }
        return result
    }

    private menuMarkup(): object {
        return this.keyboardMarkupFor([
            [this.text.adminMenu.buttonReloadData, this.text.adminMenu.buttonDownloadTables],
            [this.text.adminMenu.buttonUsersManagement, this.text.adminMenu.buttonMailing],
            [this.text.common.buttonReturnToMainMenu],
        ])
    }
}

import { Context } from 'telegraf'
import { SceneNames } from '../../enums/scene-name.enum'
import {
    PermissionsValidationResult,
    Scene,
    SceneCallbackData,
    SceneHandlerCompletion,
} from '../../scene.interface'
import { logger } from 'src/app.logger'
import { SpreadsheetPageTitles } from 'src/core/google-tables/enums/spreadsheet-page-titles'
import { internalConstants } from 'src/app.internal-constants'
import { Message, Update } from 'node_modules/telegraf/typings/core/types/typegram'

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

    readonly name: SceneNames.union = 'adminMenu'

    // =====================
    // Public methods
    // =====================

    validateUseScenePermissions(): PermissionsValidationResult {
        const ownerOrAdmin =
            this.userActivePermissions.includes('admin') ||
            this.userActivePermissions.includes('owner')
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
                return this.completion.complete('adminMenuGenerateMetrix')

            case this.text.adminMenu.buttonUsersManagement:
                return this.completion.complete('adminMenuUsersManagement')

            case this.text.adminMenu.buttonMailing:
                return this.completion.complete('adminMenuMailing')

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete('mainMenu')
        }

        return this.completion.canNotHandle()
    }

    async handleCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private async cacheBotContent(ctx: Context<Update>): Promise<void> {
        let messagePrefix = 'Список языков: '
        const languages = await this.localizationService.getRemoteLanguages()
        messagePrefix += languages.join('; ')
        messagePrefix += '\n'

        const statuses = new Map<
            SpreadsheetPageTitles.keysUnion,
            SpreadsheetPageCacheStatus | Error
        >()
        SpreadsheetPageTitles.allKeys.forEach((pageName) =>
            statuses.set(pageName, SpreadsheetPageCacheStatus.loading)
        )

        const messageInfo = await ctx.replyWithHTML(
            messagePrefix + this.generageTextForCacheStatuses(statuses)
        )
        const botContentService = this.botContentService
        const loadingPromises = SpreadsheetPageTitles.allKeys.map((pageName) => {
            const cacheSpreadsheetFunc = async function (): Promise<void> {
                try {
                    await botContentService.cacheSpreadsheetPage(pageName)
                    statuses.set(pageName, SpreadsheetPageCacheStatus.success)
                } catch (error) {
                    statuses.set(pageName, error as Error)
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
        statuses: Map<SpreadsheetPageTitles.keysUnion, SpreadsheetPageCacheStatus | Error>
    ): string {
        let result = ''
        for (const pageNameKey of SpreadsheetPageTitles.allKeys) {
            result += `\n`

            const status = statuses.get(pageNameKey)
            if (status === undefined) {
                continue
            } else if (status instanceof Error) {
                result += `❌ ${SpreadsheetPageTitles.items[pageNameKey]}:\n\`\`\`\n${statuses.get(
                    pageNameKey
                )}\n\`\`\``
            } else {
                const status: SpreadsheetPageCacheStatus = statuses.get(
                    pageNameKey
                ) as SpreadsheetPageCacheStatus
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
                result += SpreadsheetPageTitles.items[pageNameKey]
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

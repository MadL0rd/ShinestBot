import { logger } from 'src/app/app.logger'
import { internalConstants } from 'src/app/app.internal-constants'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import { DataSheetPrototype } from 'src/core/sheet-data-provider/schemas/data-sheet-prototype'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'

// =====================
// Scene data classes
// =====================
export class AdminMenuSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenu'
}
type SceneEnterDataType = AdminMenuSceneEntranceDto
interface ISceneData {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'adminMenu'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly botContentService: BotContentService
    ) {
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
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenu)

        await ctx.replyWithHTML(
            `${this.text.adminMenu.text}\n\nVersion: <b>${internalConstants.npmPackageVersion}</b>`,
            this.menuMarkup()
        )

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})

        switch (message?.text) {
            case this.text.adminMenu.buttonReloadData:
                await this.cacheBotContent(ctx)
                return this.completion.inProgress({})

            case this.text.adminMenu.buttonDownloadTables:
                return this.completion.complete({ sceneName: 'adminMenuGenerateMetrics' })

            case this.text.adminMenu.buttonUsersManagement:
                return this.completion.complete({ sceneName: 'adminMenuUsersManagement' })

            case this.text.adminMenu.buttonMailing:
                return this.completion.complete({ sceneName: 'adminMenuMailing' })

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })
        }

        return this.completion.canNotHandle({})
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
    private async cacheBotContent(ctx: Context<Update>): Promise<void> {
        let messagePrefix = 'Кеширование таблицы'

        let localizationInfo = emoji.loading + ' Загрузка локализации'
        const messageInfo = await ctx.replyWithHTML(`${messagePrefix}\n\n${localizationInfo}`)
        if (!ctx.chat) return
        try {
            await this.botContentService.cacheLocalization()
        } catch (error) {
            logger.error(`Fail to cache localization`, error)
            localizationInfo = emoji.error + ' Загрузка локализации'
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                messageInfo.message_id,
                undefined,
                `${messagePrefix}\n\n${localizationInfo}\n\n\`\`\`\n${error}\n\`\`\``,
                {
                    parse_mode: 'MarkdownV2',
                }
            )
            return
        }

        localizationInfo = emoji.success + ' Загрузка локализации'

        const statuses = new Map<
            DataSheetPrototype.SomePageContent,
            SpreadsheetPageCacheStatus.Union | Error
        >()
        DataSheetPrototype.allPagesContent.forEach((pageName) => statuses.set(pageName, 'loading'))

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            messageInfo.message_id,
            undefined,
            `${messagePrefix}\n\n${localizationInfo}\n\n${this.generageTextForCacheStatuses(
                statuses
            )}`,
            {
                parse_mode: 'MarkdownV2',
            }
        )
        const botContentService = this.botContentService
        const loadingPromises = DataSheetPrototype.allPagesContent.map((pageName) => {
            const cacheSpreadsheetFunc = async function (): Promise<void> {
                try {
                    await botContentService.cacheSpreadsheetPage(pageName)
                    statuses.set(pageName, 'success')
                } catch (error) {
                    statuses.set(pageName, error as Error)
                    logger.error(`Fail to cache spreadsheet page ${pageName}`, error)
                    return
                }
            }
            return cacheSpreadsheetFunc()
        })
        await Promise.all(loadingPromises)

        messagePrefix = 'Процесс обновления завершен'
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            messageInfo.message_id,
            undefined,
            `${messagePrefix}\n\n${localizationInfo}\n\n${this.generageTextForCacheStatuses(
                statuses
            )}`,
            {
                parse_mode: 'MarkdownV2',
            }
        )
    }

    private generageTextForCacheStatuses(
        statuses: Map<DataSheetPrototype.SomePageContent, SpreadsheetPageCacheStatus.Union | Error>
    ): string {
        let result = ''
        for (const sheetPage of DataSheetPrototype.allPagesContent) {
            const pageSchema = DataSheetPrototype.getSchemaForPage(sheetPage)
            const status = statuses.get(sheetPage)
            result += `\n`
            if (status instanceof Error) {
                result += `${SpreadsheetPageCacheStatus.getEmojiForStatus('error')} ${
                    pageSchema.sheetPublicName
                }:\n\`\`\`\n${status}\n\`\`\``
            } else {
                result += SpreadsheetPageCacheStatus.getEmojiForStatus(
                    status as SpreadsheetPageCacheStatus.Union
                )
                result += ' ' + pageSchema.sheetPublicName
            }
        }
        return result.trimmed
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

const emoji = {
    loading: '⏳',
    success: '✅',
    error: '❌',
}

namespace SpreadsheetPageCacheStatus {
    export type Union = (typeof allCases)[number]
    export const allCases = ['loading', 'success', 'error'] as const

    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return allCases.includes(value) ? (value as Union) : null
    }

    export function getEmojiForStatus(value: Union) {
        switch (value) {
            case 'loading':
                return emoji.loading
            case 'success':
                return emoji.success
            case 'error':
                return emoji.error
        }
    }
}

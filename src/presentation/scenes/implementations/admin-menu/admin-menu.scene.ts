import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserService } from 'src/business-logic/user/user.service'
import { DataSheetPrototype } from 'src/core/sheet-data-provider/schemas/data-sheet-prototype'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class AdminMenuSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenu'
    readonly mode?: 'default' | 'other'
}
type SceneEnterDataType = AdminMenuSceneEntranceDto
type ISceneData = {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenu'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly botContentService: BotContentService,
        private readonly chainTasksService: ChainTasksService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        const mode = data?.mode ?? 'default'

        switch (mode) {
            case 'default': {
                await this.ddi.sendHtml(
                    this.text.adminMenu.text({
                        versionNumber: internalConstants.app.projectVersion ?? 'undefined',
                    }),
                    this.keyboardMarkup([
                        this.text.adminMenu.buttonReloadData,
                        [
                            this.text.adminMenu.buttonDownloadTables,
                            this.text.adminMenu.buttonUsersManagement,
                        ],
                        [this.text.adminMenu.buttonMailing, this.text.adminMenu.buttonOther],
                        this.text.common.buttonReturnToMainMenu,
                    ])
                )
                break
            }
            case 'other': {
                const tasksQueueInfo = await this.chainTasksService.getTasksQueueInfo()
                await this.ddi.sendHtml(
                    this.text.adminMenu.textMenuOther({
                        chainTasksQueIsOnPause: `${tasksQueueInfo.config.queuePaused}`,
                        chainTasksCountTotal: tasksQueueInfo.totalTasksCount,
                        chainTasksCountIssued: tasksQueueInfo.issuedTasksCount,
                        chainTasksIssuedUsers: JSON.stringify(
                            tasksQueueInfo.config.issuedUserTelegramIds
                        ),
                        versionNumber: internalConstants.app.projectVersion ?? 'undefined',
                    }),
                    this.keyboardMarkup([
                        this.text.adminMenu.buttonResetIssuedUserTelegramIds,
                        this.text.adminMenu.buttonToggleExecutionQueuePause,
                        this.text.adminMenu.returnBack,
                    ])
                )
                break
            }
        }

        return this.completion.inProgress({})
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        switch (message.text) {
            case this.text.adminMenu.buttonReloadData:
                await this.cacheBotContent(ctx)
                return this.completion.inProgress({})

            case this.text.adminMenu.buttonDownloadTables:
                return this.completion.complete({ sceneName: 'adminMenuGenerateMetrics' })

            case this.text.adminMenu.buttonUsersManagement:
                return this.completion.complete({ sceneName: 'adminMenuUsersManagement' })

            case this.text.adminMenu.buttonMailing:
                return this.completion.complete({ sceneName: 'adminMenuMailing' })

            case this.text.adminMenu.buttonOther:
                return this.completion.complete({ sceneName: 'adminMenu', mode: 'other' })

            case this.text.adminMenu.buttonResetIssuedUserTelegramIds:
                await this.chainTasksService.clearIssuedUserTelegramIds()
                return this.completion.complete({ sceneName: 'adminMenu', mode: 'other' })

            case this.text.adminMenu.buttonToggleExecutionQueuePause:
                await this.chainTasksService.toggleExecutionQueuePause()
                return this.completion.complete({ sceneName: 'adminMenu', mode: 'other' })

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu', mode: 'default' })

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })

            default:
                break
        }

        return this.completion.canNotHandle()
    }

    // =====================
    // Private methods
    // =====================

    private async cacheBotContent(ctx: Context<Update>): Promise<void> {
        if (!ctx.chat) return

        let messagePrefix = 'Кеширование таблицы'
        const statuses = new Map<
            DataSheetPrototype.SomePageContent,
            SpreadsheetPageCacheStatus.Union | Error
        >()
        DataSheetPrototype.allPagesContent.forEach((pageName) => statuses.set(pageName, 'loading'))

        const messageInfo = await this.ddi.sendMessage({
            text: `${messagePrefix}\n\n${this.generateTextForCacheStatuses(statuses)}`,
            parse_mode: 'MarkdownV2',
        })

        for (const pagesBatch of this.botContentService.contentCachePriority) {
            await pagesBatch
                .map((pageName) => {
                    return this.botContentService
                        .cacheSpreadsheetPage(pageName)
                        .then(() => {
                            statuses.set(pageName, 'success')
                        })
                        .catch((error) => {
                            statuses.set(pageName, error as Error)
                            logger.error(`Fail to cache spreadsheet page ${pageName}`, error)
                        })
                })
                .combinePromises()

            this.ddi
                .editMessageText({
                    message_id: messageInfo.message_id,
                    text: `${messagePrefix}\n\n${this.generateTextForCacheStatuses(statuses)}`,
                    parse_mode: 'MarkdownV2',
                })
                .tryResult()
        }

        messagePrefix = 'Процесс обновления завершен'
        await this.ddi
            .editMessageText({
                message_id: messageInfo.message_id,
                text: `${messagePrefix}\n\n${this.generateTextForCacheStatuses(statuses)}`,
                parse_mode: 'MarkdownV2',
            })
            .tryResult()
    }

    private generateTextForCacheStatuses(
        statuses: Map<DataSheetPrototype.SomePageContent, SpreadsheetPageCacheStatus.Union | Error>
    ): string {
        let result = ''

        for (const pagesBatch of this.botContentService.contentCachePriority) {
            for (const sheetPage of pagesBatch) {
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
            result += `\n`
        }

        return result.trim()
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

    export function includes(value: string | Union): value is Union {
        return allCases.includes(value)
    }
    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return includes(value) ? value : null
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

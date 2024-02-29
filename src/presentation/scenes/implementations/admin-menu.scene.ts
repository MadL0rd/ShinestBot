import { logger } from 'src/app.logger'
import { internalConstants } from 'src/app.internal-constants'
import { UserService } from 'src/core/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'
import { LocalizationService } from 'src/core/localization/localization.service'
import { SpreadsheetPageTitles } from 'src/core/google-tables/enums/spreadsheet-page-titles'
import { BotContentService } from 'src/core/bot-content/bot-content.service'

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

    readonly name: SceneName.union = 'adminMenu'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly localizationService: LocalizationService,
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
                return this.completion.complete({ sceneName: 'mainMenu' })

            case this.text.adminMenu.buttonUsersManagement:
                return this.completion.complete({ sceneName: 'mainMenu' })

            case this.text.adminMenu.buttonMailing:
                return this.completion.complete({ sceneName: 'mainMenu' })

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
        let messageText = 'Список языков: '
        const languages = await this.localizationService.getRemoteLanguages()
        messageText += languages.join('; ')
        messageText += '\n'

        for (const pageKey of SpreadsheetPageTitles.allKeys) {
            messageText += `\n🔴 ${SpreadsheetPageTitles.items[pageKey]}`
        }

        const messageInfo = await ctx.replyWithHTML(messageText)

        if (ctx.chat) {
            for (const pageKey of SpreadsheetPageTitles.allKeys) {
                await this.botContentService.cacheSpreadsheetPage(pageKey)
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

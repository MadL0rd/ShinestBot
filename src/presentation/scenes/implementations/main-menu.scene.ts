import { internalConstants } from 'src/app/app.internal-constants'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { formatRedirectLinksInText } from 'src/presentation/utils/link-formatter.utils'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'
import { KeyboardButton, ReplyKeyboardMarkup, Update } from 'telegraf/types'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { Scene } from '../models/scene.abstract'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class MainMenuSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'mainMenu'
    readonly forceSendMenuMessageOnEnter?: boolean
}
type SceneEnterData = MainMenuSceneEntranceDto
type SceneData = {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class MainMenuScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'mainMenu'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(protected override readonly userService: UserService) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        /**
         * Check current menu buttons
         * and update only if keyboard is different
         */
        if (data?.forceSendMenuMessageOnEnter) {
            await this.ddi.sendHtml(this.menuText(), {
                reply_markup: await this.menuMarkup(),
                link_preview_options: { is_disabled: true },
            })
        } else {
            const buttons = await this.menuMarkup()
            const targetKeyboardString = JSON.stringify(buttons.keyboard)
            const userKeyboardString = this.user.currentKeyboard?.exists
                ? JSON.stringify(this.user.currentKeyboard.replyMarkup.keyboard)
                : null
            if (userKeyboardString !== targetKeyboardString) {
                await this.ddi.sendHtml(this.menuText(), {
                    reply_markup: buttons,
                    link_preview_options: { is_disabled: true },
                })
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

        if (message.text === this.text.mainMenu.buttonAdminMenu) {
            return this.completion.complete({ sceneName: 'adminMenu' })
        }
        if (message.text === this.text.common.buttonReturnToMainMenu) {
            return this.completion.complete({
                sceneName: 'mainMenu',
                forceSendMenuMessageOnEnter: true,
            })
        }

        const potentiallyChosenButtons = await this.content.mainMenuMarkup
            .filter((button) => button.buttonText === message.text)
            .map(async (button) => ({
                dto: button,
                isAvailable: await this.isMenuButtonAvailableForUser(button),
            }))
            .combinePromises()
        const chosenButton = potentiallyChosenButtons.find((button) => button.isAvailable)?.dto
        if (potentiallyChosenButtons.isNotEmpty && !chosenButton) {
            await this.ddi.sendHtml(this.menuText(), {
                reply_markup: await this.menuMarkup(),
                link_preview_options: { is_disabled: true },
            })
            return this.completion.inProgress({})
        }
        if (!chosenButton) return this.completion.canNotHandle()

        return await this.handleSelectedMenuButton(chosenButton)
    }

    override async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        switch (data.actionType) {
            case 'mailingMessageMainMenuAction': {
                this.logToUserHistory({
                    type: 'pressMailingMessageInlineButton',
                    buttonId: data.data.id,
                    mailingMessageShortId: data.data.u ?? '',
                })

                const chosenButton = this.content.mainMenuMarkup.find(
                    (btn) => btn.id === data.data.id
                )
                if (!chosenButton) return this.completion.canNotHandle()
                if (chosenButton.hideInlineKeyboardOnTap && ctx.callbackQuery.message) {
                    await this.ddi.resetMessageInlineKeyboard(ctx.callbackQuery.message.message_id)
                }
                return this.handleSelectedMenuButton(chosenButton)
            }

            default:
                return this.completion.canNotHandle()
        }
    }

    // =====================
    // Private methods
    // =====================

    private menuText(): string {
        return this.text.mainMenu.text
    }

    private isMenuButtonAvailableForUser(
        button: BotContent.MainMenuButton.BaseType | undefined
    ): boolean {
        if (!button) return false
        if (button.displayMode.type === 'inlineOnly') return false
        if (button.appTagFilter !== 'all' && button.appTagFilter !== internalConstants.app.tag) {
            return false
        }

        return true
    }

    private async handleSelectedMenuButton(chosenButton: BotContent.MainMenuButton.BaseType) {
        switch (chosenButton.actionType) {
            case 'sendContent': {
                const messageText = chosenButton.messageText
                    ? formatRedirectLinksInText({
                          text: chosenButton.messageText,
                          telegramIdString: this.user.telegramId.toString(),
                          redirectLinks: this.content.redirectLinks,
                          botSource: 'mainMenuContent',
                      })
                    : undefined
                await this.ddi.sendMediaContent({
                    ...chosenButton.media,
                    caption: messageText,
                    disableWebPagePreview: chosenButton.disableWebPagePreview,
                })
                return this.completion.inProgress({})
            }

            case 'training':
                return this.completion.complete({ sceneName: 'trainingStart' })

            case 'survey':
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: 'registration',
                    allowContinueQuestion: true,
                })

            case 'none':
                return this.completion.doNothing()
        }

        return this.completion.canNotHandle()
    }

    private async menuMarkup(): Promise<ReplyKeyboardMarkup> {
        const menuButtonsForUser = this.content.mainMenuMarkup
            .filter(
                (button): button is typeof button & { displayMode: { type: 'default' } } =>
                    button.displayMode.type !== 'inlineOnly' &&
                    this.isMenuButtonAvailableForUser(button) &&
                    button.actionType !== 'none'
            )
            .toSorted((a, b) => a.displayMode.rowNumber - b.displayMode.rowNumber)

        const menuMarkup: KeyboardButton[][] = []
        let currentRowNumber: number | undefined
        menuButtonsForUser.forEach((button) => {
            if (currentRowNumber != button.displayMode.rowNumber) {
                currentRowNumber = button.displayMode.rowNumber
                menuMarkup.push([])
            }

            menuMarkup.last?.push(button.buttonText)
        })
        if (this.userAccessRules.canAccessAdminMenu)
            menuMarkup.push([this.text.mainMenu.buttonAdminMenu])
        return { keyboard: menuMarkup, resize_keyboard: true }
    }
}

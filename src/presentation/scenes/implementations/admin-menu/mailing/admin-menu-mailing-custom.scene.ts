import { logger } from 'src/app/app.logger'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { MailingMessage } from 'src/business-logic/mailing/schemas/mailing-message.entity'
import { UserService } from 'src/business-logic/user/user.service'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { SceneName } from 'src/presentation/scenes/models/scene-name.enum'
import { SceneUsagePermissionsValidator } from 'src/presentation/scenes/models/scene-usage-permissions-validator'
import { Scene } from 'src/presentation/scenes/models/scene.abstract'
import { SceneHandlerCompletion } from 'src/presentation/scenes/models/scene.interface'
import { InjectableSceneConstructor } from 'src/presentation/scenes/scene-factory/scene-injections-provider.service'
import { generateInlineButton } from 'src/presentation/utils/inline-button.utils'
import { formatRedirectLinksInText } from 'src/presentation/utils/link-formatter.utils'
import { replaceMarkdownWithHtml } from 'src/utils/replace-markdown-with-html'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { InlineKeyboardButton } from 'telegraf/types'

// =====================
// Scene data classes
// =====================
export class AdminMenuMailingCustomSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuMailingCustom'
}
type SceneEnterData = AdminMenuMailingCustomSceneEntranceDto
type InlineButtonConfig =
    | { type: 'inlineButton'; button: InlineKeyboardButton; row: number; column: number }
    | { type: 'placeholder'; row: number; column: number }
type SceneData = {
    state: SceneState
    uniqueMailingMessageShortId: string
    text?: string | null
    inlineButtons?: InlineButtonConfig[][]
    intineButtonCreationCache?: { row: number; column: number; text?: string }
    photo?: string | null
}

type SceneState =
    | 'setText'
    | 'setInlineButtonsLayout'
    | 'chooseButtonToConfigure'
    | 'enterButtonText'
    | 'chooseInlineButtonAction'
    | 'setPhoto'
    | 'completion'
    | 'cancel'

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingCustomScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuMailingCustom'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected override readonly userService: UserService,
        protected readonly mailingService: MailingService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        const sceneData: SceneData = {
            state: 'setText',
            uniqueMailingMessageShortId: MailingMessage.generateShortId(),
        }
        return await this.initState(sceneData)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)

        const message = ctx.message
        if (message.type === 'text' && message.text === this.text.common.cancel) {
            data.state = 'cancel'
            return this.initState(data)
        }

        if (data.state === 'cancel' || data.state === 'completion') {
            logger.error(`States 'cancel' & 'completion' should not have handlers`)
            return this.initState(data)
        }

        // state handler
        switch (data.state) {
            case 'setText': {
                if (message.type !== 'text') return this.completion.canNotHandle()
                if (message.text === this.text.adminMenuMailingCustom.buttonSkipText) {
                    data.text = null
                } else {
                    data.text = replaceMarkdownWithHtml(this.addTelegramIdMaskToUrls(message.text))
                }

                data.state = 'setPhoto'
                return this.initState(data)
            }
            case 'setPhoto': {
                if (
                    data.text !== null &&
                    message.type === 'text' &&
                    message.text === this.text.adminMenuMailingCustom.buttonSkipPhoto
                ) {
                    data.photo = null
                } else if (message.type === 'photo') {
                    data.photo = message.photoDefaultSize.file_id
                } else {
                    return this.completion.canNotHandle()
                }

                data.state = 'setInlineButtonsLayout'
                return this.initState(data)
            }

            case 'setInlineButtonsLayout': {
                if (message.type !== 'text') return this.completion.canNotHandle()
                if (message.text === this.text.adminMenuMailingCustom.buttonSkipInlineButtons) {
                    data.inlineButtons = []
                    data.state = 'completion'
                    return this.initState(data)
                }
                if (
                    message.text ===
                    this.text.adminMenuMailingCustom.buttonAddButtonsPresetLikeDislike
                ) {
                    data.inlineButtons = [
                        [
                            this.content.mainMenuMarkup.find((btn) => btn.id === 'like'),
                            this.content.mainMenuMarkup.find((btn) => btn.id === 'dislike'),
                        ].compact.map((btn, index) => ({
                            type: 'inlineButton',
                            row: 0,
                            column: index,
                            button: generateInlineButton(
                                {
                                    text: btn.buttonText,
                                    action: {
                                        actionType: 'mailingMessageMainMenuAction',
                                        data: {
                                            id: btn.id,
                                            u: data.uniqueMailingMessageShortId,
                                        },
                                    },
                                },
                                'mainMenu'
                            ),
                        })),
                    ]
                    data.state = 'completion'
                    return this.initState(data)
                }

                const buttonsPerLines = message.text
                    .split(' ')
                    .map((strNumber) =>
                        Number.isNaN(Number(strNumber)) ? null : Number(strNumber)
                    )
                if (buttonsPerLines.includes(null)) return this.completion.canNotHandle()

                data.inlineButtons = buttonsPerLines
                    .filter((rowButtonsCount) => rowButtonsCount !== null)
                    .map((rowButtonsCount, rowIndex) => {
                        const row: InlineButtonConfig[] = []
                        for (let index = 0; index < rowButtonsCount; index++) {
                            row.push({
                                type: 'placeholder',
                                row: rowIndex,
                                column: index,
                            })
                        }
                        return row
                    })
                data.state = 'chooseButtonToConfigure'
                return this.initState(data)
            }

            case 'chooseButtonToConfigure': {
                if (message.type !== 'text') return this.completion.canNotHandle()
                if (!data.inlineButtons) return await this.handleEnterScene()

                const allButtonsAreFilled =
                    data.inlineButtons
                        .flat()
                        .map((btn) => btn.type)
                        .includes('placeholder') === false
                if (allButtonsAreFilled && message.text === this.text.common.continue) {
                    data.state = 'completion'
                    return this.initState(data)
                }

                const [row, column] = message.text
                    .split('|')[0]
                    .trim()
                    .split('-')
                    .compactMap((num) => Number(num))
                if ((!row && row !== 0) || (!column && column !== 0)) {
                    return this.completion.canNotHandle()
                }

                data.intineButtonCreationCache = { row, column }
                data.state = 'enterButtonText'
                return this.initState(data)
            }

            case 'enterButtonText':
                if (message.type !== 'text' || !data.intineButtonCreationCache)
                    return this.completion.canNotHandle()
                data.intineButtonCreationCache.text = message.text
                data.state = 'chooseInlineButtonAction'
                return this.initState(data)

            case 'chooseInlineButtonAction': {
                if (message.type !== 'text') return this.completion.canNotHandle()

                const mainMenuButton = this.content.mainMenuMarkup.find(
                    (btn) => btn.buttonText === message.text
                )
                if (!mainMenuButton) return this.completion.canNotHandle()

                const btnConfigCache = data.intineButtonCreationCache
                if (!data.inlineButtons || !btnConfigCache || !btnConfigCache.text) {
                    return this.completion.canNotHandle()
                }

                data.inlineButtons[btnConfigCache.row][btnConfigCache.column] = {
                    type: 'inlineButton',
                    row: btnConfigCache.row,
                    column: btnConfigCache.column,
                    button: generateInlineButton(
                        {
                            text: btnConfigCache.text,
                            action: {
                                actionType: 'mailingMessageMainMenuAction',
                                data: {
                                    id: mainMenuButton.id,
                                    u: data.uniqueMailingMessageShortId,
                                },
                            },
                        },
                        'mainMenu'
                    ),
                }
                data.state = 'chooseButtonToConfigure'
                return this.initState(data)
            }
        }
    }

    // =====================
    // State methods
    // =====================
    private async initState(data: SceneData): Promise<SceneHandlerCompletion> {
        switch (data.state) {
            case 'setText': {
                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textSetText,
                    this.keyboardMarkupWithAutoLayoutFor([
                        this.text.adminMenuMailingCustom.buttonSkipText,
                        this.text.common.cancel,
                    ])
                )
                return this.completion.inProgress(data)
            }

            case 'setPhoto':
                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textSetPhoto,
                    this.keyboardMarkupWithAutoLayoutFor(
                        [
                            data.text !== null
                                ? this.text.adminMenuMailingCustom.buttonSkipPhoto
                                : null,
                            this.text.common.cancel,
                        ].compact
                    )
                )
                return this.completion.inProgress(data)

            case 'setInlineButtonsLayout':
                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textSetInlineButtonsLayout,
                    this.keyboardMarkup([
                        this.text.adminMenuMailingCustom.buttonSkipInlineButtons,
                        this.content.mainMenuMarkup.some((btn) => btn.id === 'like') &&
                        this.content.mainMenuMarkup.some((btn) => btn.id === 'dislike')
                            ? this.text.adminMenuMailingCustom.buttonAddButtonsPresetLikeDislike
                            : null,
                        this.text.common.cancel,
                    ])
                )
                return this.completion.inProgress(data)

            case 'chooseButtonToConfigure': {
                if (!data.inlineButtons) return await this.handleEnterScene()

                const allButtonsAreFilled =
                    data.inlineButtons
                        .flat()
                        .map((btn) => btn.type)
                        .includes('placeholder') === false

                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textSelectInlineButtonToConfigure,
                    this.keyboardMarkup([
                        [
                            allButtonsAreFilled ? this.text.common.continue : null,
                            this.text.common.cancel,
                        ].compact,
                        ...data.inlineButtons.map((buttonsRow) =>
                            buttonsRow.map((btn) =>
                                btn.type === 'placeholder'
                                    ? `${btn.row}-${btn.column}`
                                    : `${btn.row}-${btn.column} | ${btn.button.text}`
                            )
                        ),
                    ])
                )
                return this.completion.inProgress(data)
            }

            case 'enterButtonText':
                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textEnterButtonText,
                    this.keyboardMarkup([[this.text.common.cancel]])
                )
                return this.completion.inProgress(data)

            case 'chooseInlineButtonAction':
                await this.ddi.sendHtml(
                    this.text.adminMenuMailingCustom.textSetInlineButtons,
                    this.keyboardMarkup([
                        [this.text.common.cancel],
                        ...this.content.mainMenuMarkup.map((btn) => [btn.buttonText]),
                    ])
                )
                return this.completion.inProgress(data)

            case 'cancel':
                return this.completion.complete({ sceneName: 'adminMenuMailing' })

            case 'completion':
                if (!data.text && !data.photo) return this.completion.canNotHandle()
                return this.completion.complete({
                    sceneName: 'adminMenuMailingPreview',
                    mailingMessage: {
                        author: this.user.telegramInfo,
                        content: {
                            type: 'custom',
                            text: data.text as any,
                            photo: data.photo as any,
                            inlineButtons:
                                data.inlineButtons?.compactMap((buttonsLine) =>
                                    buttonsLine.compactMap((btn) =>
                                        btn.type === 'inlineButton' ? btn.button : null
                                    )
                                ) ?? [],
                        },
                        delaySecPerSending: null,
                    },
                })
        }
        return this.completion.inProgress(data)
    }

    // =====================
    // Private methods
    // =====================

    private addTelegramIdMaskToUrls(messageText: string): string {
        const mask = MailingMessage.telegramIdMask
        return formatRedirectLinksInText({
            text: messageText,
            telegramIdString: mask,
            redirectLinks: this.content.redirectLinks,
            botSource: 'mailing',
        })
    }
}

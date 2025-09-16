import { MailingMessagesRepository } from 'src/business-logic/mailing/mailing-messages.repo'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { UserService } from 'src/business-logic/user/user.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../../models/scene-entrance.interface'
import { SceneName } from '../../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../../models/scene-usage-permissions-validator'
import { Scene } from '../../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../../models/scene.interface'
import { InjectableSceneConstructor } from '../../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export interface AdminMenuMailingPreformedSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'adminMenuMailingPreformed'
}
type SceneEnterData = AdminMenuMailingPreformedSceneEntranceDto
type SceneData = {
    state: SceneState
}

type SceneState = 'default' | 'creation'

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingPreformedScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuMailingPreformed'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected override readonly userService: UserService,
        protected readonly mailingService: MailingService,
        protected readonly mailingMessagesRepo: MailingMessagesRepository
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        const sceneData: SceneData = {
            state: 'default',
        }

        await this.sendDefaultMessage()

        return this.completion.inProgress(sceneData)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        // state handler
        switch (data.state) {
            case 'default': {
                return await this.handleDefaultState(message.text, ctx, data)
            }

            case 'creation': {
                return await this.handleCreationState(message.text, ctx, data)
            }
        }
    }

    // =====================
    // Private methods
    // =====================
    private async initState(data: SceneData): Promise<SceneHandlerCompletion> {
        switch (data.state) {
            case 'default': {
                await this.sendDefaultMessage()
                break
            }

            case 'creation': {
                await this.sendCreationMessage()
                break
            }
        }
        return this.completion.inProgress(data)
    }

    private async sendDefaultMessage() {
        const messages = await this.mailingMessagesRepo.findAll()
        await this.ddi.sendHtml(
            this.text.adminMenuMailing.textSelectMessage,
            this.keyboardMarkup(
                [...messages.map((message) => message.title), this.text.common.cancel].map(
                    (btn) => [btn]
                )
            )
        )
    }

    private async handleDefaultState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: SceneData
    ): Promise<SceneHandlerCompletion> {
        switch (messageText) {
            case this.text.common.cancel:
                return this.completion.complete({ sceneName: 'adminMenuMailing' })

            default: {
                const allMailingMessages = await this.mailingMessagesRepo.findAll()
                const chosenPreformedMessage = allMailingMessages.find(
                    (message) => message.title === messageText
                )
                if (!chosenPreformedMessage) return this.completion.canNotHandle()
                return this.completion.complete({
                    sceneName: 'adminMenuMailingPreview',
                    mailingMessage: chosenPreformedMessage,
                })
            }
        }
    }

    private async sendCreationMessage() {
        await this.ddi.sendHtml(
            this.text.adminMenuMailing.textEnterMessageText,
            this.keyboardMarkupWithAutoLayoutFor([this.text.common.cancel])
        )
    }

    private async handleCreationState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: SceneData
    ): Promise<SceneHandlerCompletion> {
        switch (messageText) {
            case this.text.common.cancel:
                data.state = 'default'
                return this.initState(data)

            default:
                return this.completion.complete({
                    sceneName: 'adminMenuMailingPreview',
                    mailingMessage: {
                        author: this.user.telegramInfo,
                        content: {
                            type: 'custom',
                            text: messageText,
                            photo: null,
                            inlineButtons: [],
                        },
                        delaySecPerSending: null,
                    },
                })
        }
    }
}

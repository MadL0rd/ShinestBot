import { logger } from 'src/app/app.logger'
import { MailingMessagesRepository } from 'src/business-logic/mailing/mailing-messages.repo'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { MailingMessageAny } from 'src/business-logic/mailing/schemas/mailing-message.schema'
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
export class AdminMenuMailingPreviewSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuMailingPreview'
    readonly mailingMessage: MailingMessageAny
}
type SceneEnterData = AdminMenuMailingPreviewSceneEntranceDto
type SceneData = {
    state: SceneState
    readonly mailingMessage: MailingMessageAny
}

type SceneState = 'default'

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingPreviewScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuMailingPreview'
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
        if (!data?.mailingMessage) {
            logger.error(
                'Scene entrance data corrupted: cannot find mailingMessage. Redirect to admin menu'
            )
            return this.completion.complete({ sceneName: 'adminMenu' })
        }
        const sceneData: SceneData = {
            state: 'default',
            mailingMessage: data.mailingMessage,
        }

        await this.sendDefaultMessage(sceneData)

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
        }
    }

    // =====================
    // Private methods
    // =====================
    private async initState(data: SceneData): Promise<SceneHandlerCompletion> {
        switch (data.state) {
            case 'default': {
                await this.sendDefaultMessage(data)
                break
            }
        }
        return this.completion.inProgress(data)
    }

    private async sendDefaultMessage(data: SceneData) {
        await this.ddi.sendHtml(
            this.text.adminMenuMailingPreview.text({
                delaySec: data.mailingMessage.delaySecPerSending ?? 0,
            }),
            this.keyboardMarkupWithAutoLayoutFor(
                [
                    // Fix for duplicates creation
                    data.mailingMessage.id ? null : this.text.adminMenuMailingPreview.buttonSave,
                    this.text.adminMenuMailingPreview.buttonStartMailing,
                    this.text.common.cancel,
                    this.text.adminMenu.returnBack,
                ].compact
            )
        )
        this.mailingService.sendMailingMessageToUser({
            mailingMessage: data.mailingMessage,
            user: this.user,
        })
    }

    private async handleDefaultState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: SceneData
    ): Promise<SceneHandlerCompletion> {
        const delayCommandRegExp = /[/]delay ([0-9]{1,12})/
        const parseResult = delayCommandRegExp.exec(messageText)
        if (parseResult) {
            const delaySec = Number(parseResult[1])
            data.mailingMessage.delaySecPerSending = Math.max(delaySec, 0)
            return this.initState(data)
        }

        switch (messageText) {
            case this.text.adminMenuMailingPreview.buttonSave: {
                const savedMailingMessage = await this.mailingMessagesRepo.create(
                    data.mailingMessage
                )
                await this.ddi.sendMessage({
                    text: this.text.adminMenuMailingPreview.textPreformedMessageSaved({
                        messageId: savedMailingMessage.id,
                        shortId: savedMailingMessage.shortId,
                    }),
                    parse_mode: 'MarkdownV2',
                })
                return this.completion.complete({ sceneName: 'adminMenu' })
            }

            case this.text.adminMenuMailingPreview.buttonStartMailing: {
                this.mailingService.startMailing({
                    mailingMessage: data.mailingMessage,
                    telegramIds: await this.userService.findAllTelegramIds(),
                    metadata: {
                        createdBy: 'admin',
                        adminTelegramUserInfo: this.user.telegramInfo,
                        usersSelectionCriteria: 'all',
                    },
                })
                return this.completion.complete({ sceneName: 'adminMenu' })
            }

            case this.text.common.cancel:
                return this.completion.complete({
                    sceneName: 'adminMenuMailing',
                })

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                return this.completion.canNotHandle()
        }
    }
}

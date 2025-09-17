import { logger } from 'src/app/app.logger'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { MailingMessage } from 'src/business-logic/mailing/schemas/mailing-message.entity'
import { UserService } from 'src/business-logic/user/user.service'
import { ExcludeCases } from 'src/entities/common/utility-types-extensions'
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
export interface AdminMenuMailingCopyForwardSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'adminMenuMailingCopyForward'
    readonly mailingType: SupportedMailingType
}
type SceneEnterData = AdminMenuMailingCopyForwardSceneEntranceDto
type SceneData = {
    mailingType: SupportedMailingType
}

type SupportedMailingType = ExcludeCases<MailingMessage.MessageType, 'custom'>

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingCopyForwardScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuMailingCopyForward'
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
        if (!data?.mailingType) {
            logger.error(`Scene entrance data corrupted. Redirect to admin menu`)
            return this.completion.complete({ sceneName: 'adminMenu' })
        }

        await this.ddi.sendHtml(
            this.text.adminMenuMailing.textSendMessageToForward,
            this.keyboardMarkupWithAutoLayoutFor([this.text.common.cancel])
        )

        return this.completion.inProgress(data)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)

        if (!ctx.message) {
            logger.error(`Fail to get message info from ctx. Redirect to admin menu`)
            return this.completion.complete({ sceneName: 'adminMenu' })
        }
        const message = ctx.message

        if (message.type === 'text') {
            switch (message.text) {
                case this.text.common.cancel:
                    return this.completion.complete({ sceneName: 'adminMenuMailing' })

                default:
                    break
            }
        }

        return this.completion.complete({
            sceneName: 'adminMenuMailingPreview',
            mailingMessage: {
                author: this.user.telegramInfo,
                content: {
                    type: data.mailingType,
                    messageId: message.message_id,
                    originalMessage: message,
                },
                delaySecPerSending: null,
            },
        })
    }

    // =====================
    // Private methods
    // =====================
}

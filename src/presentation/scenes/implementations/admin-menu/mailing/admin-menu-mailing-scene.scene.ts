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
export class AdminMenuMailingSceneSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuMailing'
}
type SceneEnterDataType = AdminMenuMailingSceneSceneEntranceDto
type ISceneData = {
    state: SceneState
}

type SceneState = 'default'

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingSceneScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuMailing'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
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

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        const sceneData: ISceneData = {
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
        }
    }

    // =====================
    // Private methods
    // =====================
    private async initState(data: ISceneData): Promise<SceneHandlerCompletion> {
        switch (data.state) {
            case 'default': {
                await this.sendDefaultMessage()
                break
            }
        }
        return this.completion.inProgress(data)
    }

    private async sendDefaultMessage() {
        await this.ddi.sendHtml(
            this.text.adminMenuMailing.mailingText,
            this.keyboardMarkupWithAutoLayoutFor([
                this.text.adminMenuMailing.buttonCustom,
                this.text.adminMenuMailing.buttonCopy,
                this.text.adminMenuMailing.buttonForward,
                this.text.adminMenuMailing.buttonUsePreformed,
                this.text.common.cancel,
            ])
        )
    }

    private async handleDefaultState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: ISceneData
    ): Promise<SceneHandlerCompletion> {
        switch (messageText) {
            case this.text.adminMenuMailing.buttonCustom:
                return this.completion.complete({ sceneName: 'adminMenuMailingCustom' })

            case this.text.adminMenuMailing.buttonCopy:
                return this.completion.complete({
                    sceneName: 'adminMenuMailingCopyForward',
                    mailingType: 'copyContent',
                })

            case this.text.adminMenuMailing.buttonForward:
                return this.completion.complete({
                    sceneName: 'adminMenuMailingCopyForward',
                    mailingType: 'forwardedMessage',
                })

            case this.text.adminMenuMailing.buttonUsePreformed:
                return this.completion.complete({ sceneName: 'adminMenuMailingPreformed' })

            case this.text.common.cancel:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                return this.completion.canNotHandle()
        }
    }
}

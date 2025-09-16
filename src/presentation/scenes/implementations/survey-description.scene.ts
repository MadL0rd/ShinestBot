import { UserService } from 'src/business-logic/user/user.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { Scene } from '../models/scene.abstract'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveyDescriptionSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyDescription'
}
type SceneEnterData = SurveyDescriptionSceneEntranceDto
type SceneData = {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyDescriptionScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyDescription'
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
        await this.ddi.sendHtml(
            this.text.surveyDescription.text,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyDescription.buttonStart,
                this.text.common.buttonReturnToMainMenu,
            ])
        )

        return this.completion.inProgress({})
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        switch (message.text) {
            case this.text.surveyDescription.buttonStart:
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: 'registration',
                    allowContinueQuestion: true,
                })
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
}

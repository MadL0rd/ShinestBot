import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { SurveyContextProviderType } from 'src/presentation/survey-context/abstract/survey-context-provider.interface'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class SurveyContinueSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyContinue'
    readonly providerType: SurveyContextProviderType.Union
}
type SceneEnterDataType = SurveyContinueSceneEntranceDto
type ISceneData = {
    readonly providerType: SurveyContextProviderType.Union
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyContinueScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'surveyContinue'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly dataProviderFactory: SurveyContextProviderFactoryService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        if (!data) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        await this.ddi.sendHtml(
            this.text.surveyContinue.text,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyContinue.buttonResume,
                this.text.surveyContinue.buttonBeginning,
            ])
        )

        return this.completion.inProgress({
            providerType: data.providerType,
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        if (!data || !data.providerType) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        const message = ctx.message
        if (message.type !== 'text') {
            return this.completion.canNotHandle()
        }

        switch (message.text) {
            case this.text.surveyContinue.buttonResume:
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })

            case this.text.surveyContinue.buttonBeginning: {
                const provider = this.dataProviderFactory.getSurveyContextProvider(
                    data.providerType
                )
                await provider.clearAnswersCache(this.user)
                return this.completion.complete({
                    sceneName: 'survey',
                    providerType: data.providerType,
                    allowContinueQuestion: false,
                })
            }

            default:
                break
        }

        return this.completion.canNotHandle()
    }

    // =====================
    // Private methods
    // =====================
}

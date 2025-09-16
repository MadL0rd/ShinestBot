import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
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
export interface TrainingStartSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'trainingStart'
}
type SceneEnterData = TrainingStartSceneEntranceDto
type SceneData = {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class TrainingStartScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'trainingStart'

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
        const training = this.content.training

        const cachedParagraph = BotContent.Helper.Training.getParagraphWithId(
            training,
            this.user.trainingParagraphId
        )

        const paragraphId = cachedParagraph?.id ?? training.paragraphs.first?.id
        if (!paragraphId) {
            logger.error('There is no training content')
            return this.completion.complete()
        }

        await this.ddi.sendHtml(this.text.training.textStart)
        await this.showTrainingParagraph(training, paragraphId)

        return this.completion.inProgress({})
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        const training = this.content.training

        switch (message.text) {
            case this.text.trainingStart.startButtonShowFromBeginning: {
                const firstParagraphId = training.paragraphs.first?.id
                if (!firstParagraphId) {
                    logger.error('There is no training content')
                    //return this.completion.complete()
                    return this.completion.canNotHandle()
                }

                this.user.trainingParagraphId = firstParagraphId
                await this.userService.update(this.user, ['trainingParagraphId'])
                return this.completion.complete({ sceneName: 'training' })
            }

            case this.text.trainingStart.startButtonShowLastStep:
                return this.completion.complete({ sceneName: 'training' })

            case this.text.trainingStart.startButtonSelectStep:
                return this.completion.complete({ sceneName: 'trainingSelectStep' })

            default:
                break
        }
        return this.completion.canNotHandle()
    }

    // =====================
    // Private methods
    // =====================

    private menuMarkup(): object {
        const canContinue =
            this.user.trainingParagraphId &&
            this.user.trainingParagraphId != this.content.training.paragraphs.first?.id
        return super.keyboardMarkupWithAutoLayoutFor(
            [
                canContinue ? this.text.trainingStart.startButtonShowLastStep : null,
                this.text.trainingStart.startButtonShowFromBeginning,
                this.text.trainingStart.startButtonSelectStep,
            ].compact
        )
    }

    private async showTrainingParagraph(
        training: BotContent.Training.BaseType,
        currentParagraphId: string
    ): Promise<void> {
        if (training.chapters.isEmpty) return

        const chaptersListText = BotContent.Formatter.Training.getTrainingPlanText(
            currentParagraphId,
            training,
            this.text
        )

        if (!chaptersListText) return

        await this.ddi.sendHtml(chaptersListText, this.menuMarkup())
    }
}

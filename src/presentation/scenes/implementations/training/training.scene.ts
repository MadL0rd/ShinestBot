import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Markup } from 'telegraf'
import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from 'telegraf/types'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class TrainingSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'training'
}
type SceneEnterDataType = TrainingSceneEntranceDto
type ISceneData = {
    trainingParagraphId: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class TrainingScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'training'

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
        const training = this.content.training
        const paragraphId = this.user.trainingParagraphId ?? training.paragraphs[0].id

        await this.showTrainingParagraphAndQuestion(training, paragraphId)

        this.user.trainingParagraphId = paragraphId
        await this.updateUserParagraphId(paragraphId)

        return this.completion.inProgress(this.generateData({ trainingParagraphId: paragraphId }))
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        const training = this.content.training
        if (!this.user.trainingParagraphId) return this.completion.canNotHandle()

        const currentParagraph = BotContent.Helper.Training.getParagraphWithId(
            training,
            this.user.trainingParagraphId
        )
        if (!currentParagraph) return this.completion.canNotHandle()

        const currentChapter = BotContent.Helper.Training.getChapterWithId(
            training,
            currentParagraph.chapterId
        )
        if (!currentChapter) return this.completion.canNotHandle()

        switch (message.text) {
            case this.content.uniqueMessage.training.buttonContinue: {
                const nextParagraph = BotContent.Helper.Training.getNextParagraph(
                    currentParagraph.id,
                    training
                )
                if (!nextParagraph) return this.completion.canNotHandle()

                await this.showTrainingParagraphAndQuestion(training, nextParagraph.id)
                await this.updateUserParagraphId(nextParagraph.id)

                return this.completion.inProgress(
                    this.generateData({
                        trainingParagraphId: nextParagraph.id,
                    })
                )
            }

            case this.content.uniqueMessage.training.buttonBackToPreviousStep: {
                const previousParagraph = BotContent.Helper.Training.getPreviousParagraph(
                    currentParagraph.id,
                    training
                )
                if (!previousParagraph) return this.completion.canNotHandle()

                await this.showTrainingParagraphAndQuestion(training, previousParagraph.id)
                await this.updateUserParagraphId(previousParagraph.id)

                return this.completion.inProgress(
                    this.generateData({
                        trainingParagraphId: previousParagraph.id,
                    })
                )
            }
            case this.content.uniqueMessage.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })

            case this.text.training.buttonSelectStep:
                return this.completion.complete({ sceneName: 'trainingSelectStep' })

            default:
                break
        }

        return this.completion.complete()
    }

    // =====================
    // Private methods
    // =====================
    private async updateUserParagraphId(paragraphId: string) {
        this.user.trainingParagraphId = paragraphId
        await this.userService.update(this.user, ['trainingParagraphId'])
    }

    private async showTrainingParagraphAndQuestion(
        training: BotContent.Training.BaseType,
        currentParagraphId: string
    ) {
        if (training.chapters.isEmpty) return

        const chaptersListText = BotContent.Formatter.Training.getTrainingPlanText(
            currentParagraphId,
            training,
            this.text
        )
        const currentParagraph = BotContent.Helper.Training.getParagraphWithId(
            training,
            currentParagraphId
        )
        const chapterText = currentParagraph?.text

        this.logToUserHistory({ type: 'selectedParagraph', paragraphId: currentParagraphId })

        if (!chaptersListText || !chapterText) return

        await this.ddi.sendHtml(chaptersListText, {
            reply_markup: this.menuMarkup(currentParagraphId).reply_markup,
        })

        await this.ddi.sendMediaContent({
            ...currentParagraph.media,
            caption: chapterText,
            disableWebPagePreview: currentParagraph.disableWebPagePreview,
        })
    }

    private menuMarkup(
        currentParagraphId: string
    ): Markup.Markup<ReplyKeyboardMarkup | ReplyKeyboardRemove> {
        const isFirstParagraph = this.content.training.paragraphs.first?.id === currentParagraphId
        const isLastParagraph = this.content.training.paragraphs.last?.id === currentParagraphId
        const buttonsList: string[][] = [
            [],
            [this.text.common.buttonReturnToMainMenu, this.text.training.buttonSelectStep],
        ]
        if (!isFirstParagraph) buttonsList[0].push(this.text.training.buttonBackToPreviousStep)
        if (!isLastParagraph) buttonsList[0].push(this.text.training.buttonContinue)

        return super.keyboardMarkup(buttonsList)
    }
}

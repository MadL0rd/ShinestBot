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
export class TrainingSelectStepSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'trainingSelectStep'
}
type SceneEnterData = TrainingSelectStepSceneEntranceDto
type SceneData = {
    readonly state: 'selectChapter' | 'selectParagraph'
    readonly paragraphRecord?: Record<string, string>
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class TrainingSelectStepScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'trainingSelectStep'
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
        if (training.chapters.length === 1) {
            const chapter = training.chapters[0]
            await this.showTrainingParagraphs(training, chapter)
            const paragraphRecord = training.paragraphs
                .filter((paragraph) => paragraph.chapterId === chapter.id)
                .reduce(
                    (acc, paragraph) => {
                        acc[paragraph.name] = paragraph.id
                        return acc
                    },
                    {} as Record<string, string>
                )
            return this.completion.inProgress({
                state: 'selectParagraph',
                paragraphRecord: paragraphRecord,
            })
        }
        await this.showTrainingChapters(training)

        return this.completion.inProgress({
            state: 'selectChapter',
        })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        const training = this.content.training
        switch (data.state) {
            case 'selectChapter': {
                const chapter = training.chapters.find((chapter) => chapter.name === message.text)
                if (!chapter) return this.completion.canNotHandle()

                const paragraphRecord = training.paragraphs
                    .filter((paragraph) => paragraph.chapterId === chapter.id)
                    .reduce(
                        (acc, paragraph) => {
                            acc[paragraph.name] = paragraph.id
                            return acc
                        },
                        {} as Record<string, string>
                    )

                await this.showTrainingParagraphs(training, chapter)
                return this.completion.inProgress({
                    state: 'selectParagraph',
                    paragraphRecord: paragraphRecord,
                })
            }

            case 'selectParagraph': {
                const paragraphId = data.paragraphRecord ? data.paragraphRecord[message.text] : null
                if (!paragraphId) return this.completion.canNotHandle()

                this.user.trainingParagraphId = paragraphId
                await this.userService.update(this.user, ['trainingParagraphId'])
                return this.completion.complete({ sceneName: 'training' })
            }
        }
    }

    // =====================
    // Private methods
    // =====================
    private async showTrainingChapters(training: BotContent.Training.BaseType): Promise<void> {
        if (training.chapters.length > 0) {
            let chaptersListText = ''
            const chaptersButtonMarkup = []
            for (let i = 0; i < training.chapters.length; i++) {
                const chapterIndex = i + 1
                const page = training.chapters[i]
                chaptersListText += chapterIndex + '. ' + page.name + '\n'
                chaptersButtonMarkup.push([page.name])
            }

            await this.ddi.sendHtml(chaptersListText, super.keyboardMarkup(chaptersButtonMarkup))
        }
    }

    private async showTrainingParagraphs(
        training: BotContent.Training.BaseType,
        chapter: BotContent.Training.Chapter
    ): Promise<void> {
        if (training.chapters.length > 0) {
            let paragraphsListText = ''
            const paragraphsButtonMarkup: string[] = []

            training.paragraphs.map((paragraph) => {
                if (paragraph.chapterId === chapter.id) {
                    paragraphsListText += `- ${paragraph.name}\n`
                    paragraphsButtonMarkup.push(paragraph.name)
                }
            })

            await this.ddi.sendHtml(
                paragraphsListText,
                super.keyboardMarkupWithAutoLayoutFor(paragraphsButtonMarkup)
            )
        }
    }
}

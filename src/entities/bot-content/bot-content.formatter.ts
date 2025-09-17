import { BotContent } from '.'

/**
 * Namespace for BotContent entity formatter functions.
 * This namespace should contain functions responsible for formatting entity data.
 */
export namespace _BotContentFormatter {
    export namespace Training {
        export function getTrainingPlanText(
            currentParagraphId: string,
            training: BotContent.Training.BaseType,
            text: BotContent.UniqueMessage
        ): string | null {
            if (training.chapters.isEmpty) return null

            let chaptersListText = ''
            let isParagraphSelected = false
            for (let i = 0; i < training.chapters.length; i++) {
                const chapterIndex = i + 1
                const chapter = training.chapters[i]
                if (training.chapters.length > 1)
                    chaptersListText += chapterIndex + '. ' + chapter.name + '\n'

                const paragraphFounded = chapter.paragraphIds.find(
                    (id) => id === currentParagraphId
                )
                if (isParagraphSelected || !paragraphFounded) {
                    continue
                }

                let indicator = text.training.indicatorParagraphPassed
                chapter.paragraphIds.map((paragraphId) => {
                    const element = training.paragraphs.find(
                        (paragraph) => paragraph.id === paragraphId
                    )

                    if (element?.id === currentParagraphId) {
                        indicator = text.training.indicatorParagraphCurrent
                        chaptersListText += `<b>${indicator} ${element.name}</b>\n`
                        isParagraphSelected = true
                        indicator = text.training.indicatorParagraphNext
                    } else {
                        chaptersListText += `${indicator} ${element?.name}\n`
                    }
                })
            }
            return chaptersListText
        }
    }
}

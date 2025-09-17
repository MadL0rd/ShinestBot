import { BotContent } from '.'
import { UniqueMessageWithParams } from './nested/unique-message.entity'

/**
 * Namespace for BotContent entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _BotContentHelper {
    export function insertBotContentMethods(
        base: BotContent.BaseTypePrimitive
    ): BotContent.BaseType {
        const { uniqueMessage, ...common } = base
        return {
            ...common,
            uniqueMessage: new UniqueMessageWithParams(uniqueMessage),
        }
    }

    export namespace Training {
        export const contentTypeNames = {
            chapter: 'Глава',
            paragraph: 'Параграф',
        } as const

        export function getParagraphWithId(
            training: BotContent.Training.BaseType,
            paragraphId?: string | null
        ): BotContent.Training.Paragraph | null {
            if (!paragraphId) return null

            const paragraphFounded = training.paragraphs.find(
                (paragraph) => paragraph.id === paragraphId
            )
            return paragraphFounded ?? null
        }

        export function getChapterWithId(
            training: BotContent.Training.BaseType,
            chapterId?: string
        ): BotContent.Training.Chapter | null {
            if (!chapterId) return null

            const chapterFounded = training.chapters.find((paragraph) => paragraph.id === chapterId)
            return chapterFounded ?? null
        }

        export function getNextParagraph(
            paragraphId: string,
            training: BotContent.Training.BaseType
        ): BotContent.Training.Paragraph | undefined {
            const paragraphIndex = training.paragraphs.findIndex(
                (paragraph) => paragraph.id === paragraphId
            )
            if (paragraphIndex === -1) return undefined
            return training.paragraphs[paragraphIndex + 1]
        }

        export function getPreviousParagraph(
            paragraphId: string,
            training: BotContent.Training.BaseType
        ): BotContent.Training.Paragraph | undefined {
            const paragraphIndex = training.paragraphs.findIndex(
                (paragraph) => paragraph.id === paragraphId
            )
            if (paragraphIndex === -1) return undefined
            return training.paragraphs[paragraphIndex - 1]
        }
    }
}

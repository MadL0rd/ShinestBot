import { MediaContent } from 'src/entities/common/media-content.entity'

export namespace _Training {
    export type BaseType = {
        chapters: Chapter[]
        paragraphs: Paragraph[]
    }

    export type Paragraph = {
        id: string
        chapterId: string
        name: string
        text: string
        media: MediaContent
        disableWebPagePreview: boolean
    }

    export type Chapter = {
        id: string
        name: string
        paragraphIds: string[]
    }
}

import { MediaContent } from 'src/entities/common/media-content.entity'

export namespace _Onboarding {
    export type Page = {
        id: string
        groupId: string
        messageText?: string
        buttonText?: string
        media: MediaContent
        disableWebPagePreview: boolean
    }

    export type PagesGroup = {
        groupId: string
        haveFilters: boolean
        type: PagesGroupType.Union
        priority: number
        utm: string[]
    }

    export namespace PagesGroupType {
        export type Union = (typeof allCases)[number]
        export const allCases = ['onStart'] as const

        export function includes(value: string | Union): value is Union {
            return allCases.includes(value)
        }
    }
}

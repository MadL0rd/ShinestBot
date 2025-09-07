import { MediaContent } from 'src/entities/common/media-content.entity'

export namespace _MainMenuButton {
    export type BaseType = ButtonBase & ButtonTypified

    export type ButtonBase = {
        id: string
        inlineModeOnly: boolean
        hideInlineKeyboardOnTap: boolean
        buttonText: string
        appTagFilter: 'dev' | 'prod' | 'all'
        rowNumber: number
    }

    export type ButtonTypified = ButtonSendContent | ButtonSceneSegue | ButtonWebApp | ButtonOther

    type ButtonSendContent = {
        actionType: 'sendContent'
        messageText?: string
        disableWebPagePreview: boolean
        media: MediaContent
    }

    type ButtonSceneSegue = {
        actionType: Exclude<ActionType.Union, 'sendContent' | 'sendDayStat'>
    }

    type ButtonWebApp = {
        actionType: never
    }

    type ButtonOther = {
        actionType: 'none'
    }

    export namespace ActionType {
        export type Union = (typeof allCases)[number]
        export const allCases = ['sendContent', 'trainingStart', 'none'] as const

        export function includes(value: string | Union): value is Union {
            return allCases.includes(value)
        }
        export function castToInstance(value?: string | Union | null): Union | null {
            if (!value) return null
            return includes(value) ? value : null
        }
    }
}

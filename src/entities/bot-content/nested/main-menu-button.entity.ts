import { MediaContent } from 'src/entities/common/media-content.entity'

export namespace _MainMenuButton {
    export type BaseType = ButtonBase & ButtonTypified

    export type ButtonBase = {
        id: string
        hideInlineKeyboardOnTap: boolean
        buttonText: string
        appTagFilter: 'dev' | 'prod' | 'all'
        displayMode: DisplayMode
    }

    export type DisplayMode =
        | {
              type: 'default'
              rowNumber: number
          }
        | {
              type: 'inlineOnly'
          }

    export type ButtonTypified = ButtonSendContent | ButtonSceneSegue | ButtonWebApp | ButtonOther

    type ButtonSendContent = {
        actionType: 'sendContent'
        messageText?: string
        disableWebPagePreview: boolean
        media: MediaContent
    }

    type ButtonSceneSegue = {
        actionType: Exclude<ActionType.Union, 'sendContent'>
    }

    type ButtonWebApp = {
        actionType: never
    }

    type ButtonOther = {
        actionType: 'none'
    }

    export namespace ActionType {
        export type Union = (typeof allCases)[number]
        export const allCases = ['sendContent', 'training', 'survey', 'none'] as const

        export function includes(value: string | Union): value is Union {
            return allCases.includes(value)
        }
        export function castToInstance(value?: string | Union | null): Union | null {
            if (!value) return null
            return includes(value) ? value : null
        }
    }
}

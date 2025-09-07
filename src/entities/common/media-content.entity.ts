import { ParseMode } from 'telegraf/types'

export type MediaContent = {
    photo: string[]
    video: string[]
    videoNote: string[]
    voice: string[]
    audio: string[]
    document: string[]
    animation: string[]
    sticker: string[]
}

export type MediaContentWithSendOptions = MediaContent & {
    caption?: string
    disableWebPagePreview?: boolean
    parse_mode?: ParseMode
}

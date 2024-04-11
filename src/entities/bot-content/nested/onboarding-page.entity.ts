import { _MediaContent } from './media-content.entity'

export namespace _OnboardingPage {
    export import MediaContent = _MediaContent

    export type BaseType = {
        id: string
        messageText: string
        buttonText: string
        media: MediaContent.BaseType
    }
}

import { Survey } from '../survey'
import { _BotContentFormatter } from './bot-content.formatter'
import { _BotContentHelper } from './bot-content.helper'
import { _MediaContent } from './nested/media-content.entity'
import { _OnboardingPage } from './nested/onboarding-page.entity'
import { UniqueMessage as _UniqueMessage } from './nested/unique-message.entity'

/**
 * Namespace for BotContent entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _BotContentEntity {
    export import Helper = _BotContentHelper
    export import Formatter = _BotContentFormatter

    export import OnboardingPage = _OnboardingPage
    export import MediaContent = _MediaContent
    export type UniqueMessage = _UniqueMessage

    export type BaseType = {
        language: string
        uniqueMessage: UniqueMessage
        onboarding: OnboardingPage.BaseType[]
        survey: Survey.BaseType
    }
}

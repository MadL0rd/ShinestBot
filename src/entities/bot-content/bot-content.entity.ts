import { OmitFields } from '../common/utility-types-extensions'
import { Survey } from '../survey'
import { _BotContentFormatter } from './bot-content.formatter'
import { _BotContentHelper } from './bot-content.helper'
import { _MainMenuButton } from './nested/main-menu-button.entity'
import { _Onboarding } from './nested/onboarding.entity'
import { _RedirectLinks } from './nested/redirect-links.entity'
import { _Training } from './nested/training.entity'
import {
    UniqueMessagePrimitive as _UniqueMessagePrimitive,
    UniqueMessageWithParams as _UniqueMessageWithParams,
} from './nested/unique-message.entity'

/**
 * Namespace for BotContent entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _BotContentEntity {
    export import Helper = _BotContentHelper
    export import Formatter = _BotContentFormatter

    export import Onboarding = _Onboarding
    export import Training = _Training
    export import MainMenuButton = _MainMenuButton
    export type UniqueMessage = _UniqueMessageWithParams
    export type UniqueMessagePrimitive = _UniqueMessagePrimitive
    export import RedirectLinks = _RedirectLinks

    export type BaseType = {
        language: string
        uniqueMessage: UniqueMessage
        onboardingGroups: Onboarding.PagesGroup[]
        onboardingPages: Onboarding.Page[]
        survey: Survey.BaseType
        training: Training.BaseType
        mainMenuMarkup: MainMenuButton.BaseType[]
        redirectLinks: RedirectLinks.BaseType[]
    }

    export type BaseTypePrimitive = OmitFields<BaseType, 'uniqueMessage'> & {
        uniqueMessage: UniqueMessagePrimitive
    }
}

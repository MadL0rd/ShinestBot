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
        return {
            language: base.language,
            uniqueMessage: new UniqueMessageWithParams(base.uniqueMessage),
            onboarding: base.onboarding,
            survey: base.survey,
        }
    }
}

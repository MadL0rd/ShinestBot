import { internalConstants } from 'src/app/app.internal-constants'
import { User } from 'src/business-logic/user/schemas/user.schema'

export function getLanguageFor(user: User): string {
    return (
        user.internalInfo?.language?.upperCased ??
        user.telegramInfo?.language_code?.upperCased ??
        internalConstants.defaultLanguage
    )
}

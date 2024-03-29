import { internalConstants } from 'src/app/app.internal-constants'
import { UserDocument } from 'src/business-logic/user/schemas/user.schema'

export function getLanguageFor(user: UserDocument): string {
    return (
        user.internalInfo?.language?.upperCased ??
        user.telegramInfo?.language_code?.upperCased ??
        internalConstants.defaultLanguage
    )
}

import { internalConstants } from 'src/app.internal-constants'
import { UserDocument } from 'src/core/user/schemas/user.schema'

export function getLanguageFor(user: UserDocument): string {
    return (
        user.internalInfo?.language?.upperCased ??
        user.telegramInfo?.language_code?.upperCased ??
        internalConstants.defaultLanguage
    )
}

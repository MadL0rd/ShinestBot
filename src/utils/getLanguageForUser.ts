import { internalConstants } from 'src/app/app.internal-constants'
import { UserProfile } from 'src/entities/user-profile/user-profile.entity'

export function getLanguageFor(user: UserProfile): string {
    return (
        user.internalInfo?.language?.upperCased ??
        user.telegramInfo?.language_code?.upperCased ??
        internalConstants.defaultLanguage
    )
}

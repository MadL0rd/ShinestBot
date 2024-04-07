import { internalConstants } from 'src/app/app.internal-constants'
import { _UserProfileEntity as UserProfile } from './user-profile.entity'
/**
 * Namespace for UserProfile entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _UserProfileHelper {
    export function getActivePermissionNames(
        user: UserProfile.BaseType
    ): UserProfile.PermissionNames.Union[] {
        return (
            user.internalInfo?.permissions?.compactMap((permission) => {
                if (permission.expirationDate && permission.expirationDate < new Date()) return null
                return UserProfile.PermissionNames.castToInstance(
                    permission.permissionName
                )
            }) ?? []
        )
    }

    export function getLanguageFor(user: UserProfile.BaseType): string {
        return (
            user.internalInfo?.language?.upperCased ??
            user.telegramInfo?.language_code?.upperCased ??
            internalConstants.defaultLanguage
        )
    }
}

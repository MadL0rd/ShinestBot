import { UserPermissionNames } from 'src/entities/user-profile/nested/user-permission-names.enum'
import { UserProfile } from 'src/entities/user-profile/user-profile.entity'

export function getActiveUserPermissionNames(user: UserProfile): UserPermissionNames.Union[] {
    return (
        user.internalInfo?.permissions?.compactMap((permission) => {
            if (permission.expirationDate && permission.expirationDate < new Date()) return null
            return UserPermissionNames.castToInstance(permission.permissionName)
        }) ?? []
    )
}

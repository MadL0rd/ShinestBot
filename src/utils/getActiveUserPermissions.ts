import { UserPermissionNames } from 'src/business-logic/user/enums/user-permission-names.enum'
import { UserDocument } from 'src/business-logic/user/schemas/user.schema'

export function getActiveUserPermissionNames(user: UserDocument): UserPermissionNames.union[] {
    return (
        user.internalInfo?.permissions?.compactMap((permission) => {
            if (permission.expirationDate && permission.expirationDate < new Date()) return null
            return UserPermissionNames.castToInstance(permission.permissionName)
        }) ?? []
    )
}

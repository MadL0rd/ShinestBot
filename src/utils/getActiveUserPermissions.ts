import {
    UserPermissionNamesStable as UserPermissionName,
    UserPermissionNamesStable,
} from 'src/core/user/enums/user-permission.enum'
import { UserDocument } from 'src/core/user/schemas/user.schema'

export function getActiveUserPermissionNames(user: UserDocument): UserPermissionName[] {
    return (
        user.internalInfo?.permissions?.compactMap((permission) => {
            if (permission.expirationDate && permission.expirationDate < new Date()) {
                return null
            }
            return (
                UserPermissionNamesStable[permission?.permissionName] ??
                permission?.permissionName ??
                null
            )
        }) ?? []
    )
}

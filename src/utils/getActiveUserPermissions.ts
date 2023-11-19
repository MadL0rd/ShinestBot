import { UserPermissionNames } from 'src/core/user/enums/user-permission-names.enum'
import { UserDocument } from 'src/core/user/schemas/user.schema'

export function getActiveUserPermissions(user: UserDocument): UserPermissionNames[] {
    return (
        user.internalInfo?.permissions
            ?.map((permission) => {
                if (permission.expirationDate < new Date()) {
                    return undefined
                }
                return permission?.permissionName ?? undefined
            })
            .filter((x) => !!x) ?? []
    )
}

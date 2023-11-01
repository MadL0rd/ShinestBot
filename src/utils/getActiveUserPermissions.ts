import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { UserDocument } from 'src/core/user/schemas/user.schema'

export function getActiveUserPermissions(user: UserDocument): UserPermissions[] {
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

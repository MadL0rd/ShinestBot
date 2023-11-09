import { UserPermissions } from '../../enums/user-permissions.enum'

export class UserInternalInfo {
    startParam: string | null = null
    language?: string
    permissions?: UserPermission[]
}

export class UserPermission {
    readonly permissionName: UserPermissions
    readonly startDate?: Date
    readonly expirationDate?: Date
}

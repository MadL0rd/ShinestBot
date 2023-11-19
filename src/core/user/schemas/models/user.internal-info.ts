import { UserPermissionNames } from '../../enums/user-permission-names.enum'

export class UserInternalInfo {
    startParam: string | null = null
    language?: string
    permissions: UserPermission[] = []
}

export class UserPermission {
    readonly permissionName: UserPermissionNames
    readonly comment?: string
    readonly startDate?: Date
    readonly expirationDate?: Date
}

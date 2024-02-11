import { UserPermissionName } from '../../enums/user-permission.enum'

export class UserInternalInfo {
    startParam: string | null = null
    registrationDate: Date = new Date()
    language?: string
    permissions: UserPermission[]
    morningNotificationTime?: string
    eveningNotification?: string
}

export class UserPermission {
    permissionName: UserPermissionName | string
    comment?: string
    startDate: Date = new Date()
    expirationDate?: Date
}

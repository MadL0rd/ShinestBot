import { UserPermissionNames } from '../../enums/user-permission-names.enum'

export class UserInternalInfo {
    startParam: string | null = null
    registrationDate: Date = new Date()
    language?: string
    permissions: UserPermission[]
    notificationsSchedule: UserNotificationsSchedule
}

export class UserPermission {
    permissionName: UserPermissionNames.union | string
    comment?: string
    startDate: Date = new Date()
    expirationDate?: Date
}

export class UserNotificationsSchedule {
    morning?: string
    evening?: string
}

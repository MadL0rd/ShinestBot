import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserPermissionNames } from './user-permission-names.enum'

export class UserInternalInfo {
    startParam: string | null = null
    registrationDate: Date = new Date()
    language?: string
    permissions: UserPermission[]
    notificationsSchedule: UserNotificationsSchedule
    surveyAnswersCache?: Survey.PassedAnswersCache
    publicationEditingCache?: Survey.PassedAnswersCache
    publications: string[]
    adminsOnly: AdminOnlyInfo
}

export class AdminOnlyInfo {
    modifyingPublicationIdPrepared?: string
    modifyingPublicationIdCurrent?: string
}

export class UserPermission {
    permissionName: UserPermissionNames.Union | string
    comment?: string
    startDate: Date = new Date()
    expirationDate?: Date
}

export class UserNotificationsSchedule {
    morning?: string
    evening?: string
}

import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { _UserProfilePermissionNames } from './permission-names.enum'

export namespace _UserProfileInternalInfo {
    export type BaseType = {
        startParam: string | null
        registrationDate: Date
        language?: string
        permissions: Permission[]
        notificationsSchedule: NotificationsSchedule
        surveyAnswersCache?: Survey.PassedAnswersCache
        publicationEditingCache?: Survey.PassedAnswersCache
        publications: string[]
        adminsOnly: AdminOnlyInfo
    }

    export type AdminOnlyInfo = {
        modifyingPublicationIdPrepared?: string
        modifyingPublicationIdCurrent?: string
    }

    export type Permission = {
        permissionName: PermissionNames.Union | string
        comment?: string
        startDate: Date
        expirationDate?: Date
    }

    export import PermissionNames = _UserProfilePermissionNames

    export type NotificationsSchedule = {
        morning?: string
        evening?: string
    }
}

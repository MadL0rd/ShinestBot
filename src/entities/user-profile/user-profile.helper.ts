import { internalConstants } from 'src/app/app.internal-constants'
import { Nullish } from '../common/nullish-prop.type'
import { _UserProfileEntity as UserProfile } from './user-profile.entity'
/**
 * Namespace for UserProfile entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _UserProfileHelper {
    export function getActivePermissionNames(
        permissions: UserProfile.Permission[]
    ): UserProfile.PermissionNames.Union[] {
        return (
            permissions?.compactMap((permission) => {
                if (permission.expirationDate && permission.expirationDate < new Date()) return null
                return UserProfile.PermissionNames.castToInstance(permission.permissionName)
            }) ?? []
        )
    }

    export function getLanguageFor(user: Nullish<UserProfile.BaseType>): string {
        return (
            user?.language?.toUpperCase() ??
            user?.telegramInfo?.language_code?.toUpperCase() ??
            internalConstants.sheetContent.defaultLanguage
        )
    }

    export function getUserAccessRules(
        permissions: UserProfile.Permission[]
    ): UserProfile.AccessRules {
        const permissionNames = getActivePermissionNames(permissions)
        const rules: UserProfile.AccessRules = {
            activePermissionNames: permissionNames,
            canWriteInModerationForum: false,
            canBeUsedForStartParamRewriting: false,
            canManageMailings: false,
            canAccessAdminMenu: false,
            isBanned: false,
            canAppointAdmins: false,
            canBanUsers: false,
            canBeBanned: false,
        }

        for (const permission of permissionNames) {
            if (permission === 'owner') rules.canAppointAdmins = true
            switch (permission) {
                case 'owner':
                case 'admin':
                    rules.canBeUsedForStartParamRewriting = true
                    rules.canWriteInModerationForum = true
                    rules.canManageMailings = true
                    rules.canAccessAdminMenu = true
                    rules.canBanUsers = true
                    rules.canBeBanned = false

                    break
                case 'moderator':
                    rules.canWriteInModerationForum = true
                    break
                case 'banned':
                    rules.isBanned = true
                    break
            }
        }

        return rules
    }

    export function getForumDialogLink(
        topicInfo: UserProfile.TelegramTopic.BaseType | undefined | null
    ) {
        if (!topicInfo) return undefined
        const chatId = topicInfo.chatId.toString().replace('-100', '')
        return `https://t.me/c/${chatId}/${topicInfo.messageThreadId}/`
    }

    export function getForumDialogUniversalLink(user: UserProfile.BaseType | undefined | null) {
        if (!user) return undefined
        return `${internalConstants.webhookAndPorts.apiDomain}/users/dialog/${user.telegramId}`
    }
}

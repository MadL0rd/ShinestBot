import { internalConstants } from 'src/app/app.internal-constants'
import { Nullish } from '../common/nullish-prop.type'
import { _UserProfileEntity as UserProfile } from './user-profile.entity'
/**
 * Namespace for UserProfile entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _UserProfileHelper {
    export function getActivePermissionNames(
        user: UserProfile.BaseType
    ): UserProfile.PermissionNames.Union[] {
        return (
            user.permissions?.compactMap((permission) => {
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

    type AccessRules = {
        canWriteInModerationForum: boolean
        canBeUsedForStartParamRewriting: boolean
        canManageMailings: boolean
        canUseHints: boolean
        canMergeLeads: boolean
    }
    export function getUserAccessRules(user: UserProfile.BaseType): AccessRules {
        const permissionNames = getActivePermissionNames(user)
        const rules: AccessRules = {
            canWriteInModerationForum: false,
            canBeUsedForStartParamRewriting: false,
            canManageMailings: false,
            canUseHints: false,
            canMergeLeads: false,
        }

        for (const permission of permissionNames) {
            switch (permission) {
                case 'owner':
                case 'admin':
                    rules.canBeUsedForStartParamRewriting = true
                    rules.canWriteInModerationForum = true
                    rules.canManageMailings = true
                    rules.canUseHints = true
                    rules.canMergeLeads = true
                    break
                case 'moderator':
                    rules.canWriteInModerationForum = true
                    rules.canUseHints = true
                    rules.canMergeLeads = true
                    break
                case 'banned':
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

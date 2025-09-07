import { BotContent } from 'src/entities/bot-content'
import { UserProfile } from 'src/entities/user-profile'
import { PermissionsValidationResult } from './scene.interface'

export namespace SceneUsagePermissionsValidator {
    export interface IPermissionsValidator {
        validateUseScenePermissions(
            userActivePermissions: UserProfile.PermissionNames.Union[],
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult
    }

    export class CanUseIfNotBanned implements IPermissionsValidator {
        validateUseScenePermissions(
            userActivePermissions: UserProfile.PermissionNames.Union[],
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult {
            if (userActivePermissions === null || userActivePermissions.length === 0) {
                return { canUseScene: true }
            }
            if (userActivePermissions.includes('banned')) {
                return {
                    canUseScene: false,
                    validationErrorMessage: text.common.bannedUserMessage,
                }
            }
            return { canUseScene: true }
        }
    }

    export class OwnerOrAdminOnly implements IPermissionsValidator {
        validateUseScenePermissions(
            userActivePermissions: UserProfile.PermissionNames.Union[],
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult {
            const ownerOrAdmin =
                userActivePermissions.includes('admin') || userActivePermissions.includes('owner')
            if (ownerOrAdmin) {
                return { canUseScene: true }
            }
            return { canUseScene: false }
        }
    }
}

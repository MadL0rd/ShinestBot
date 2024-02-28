import { UniqueMessage } from 'src/core/bot-content/schemas/models/bot-content.unique-message'
import { UserPermissionNames } from 'src/core/user/enums/user-permission-names.enum'
import { PermissionsValidationResult } from './scene.interface'

export namespace SceneUsagePermissionsValidator {
    export interface IPermissionsValidator {
        validateUseScenePermissions(
            userActivePermissions: UserPermissionNames.union[],
            text: UniqueMessage
        ): PermissionsValidationResult
    }

    export class CanUseIfNotBanned implements IPermissionsValidator {
        validateUseScenePermissions(
            userActivePermissions: UserPermissionNames.union[],
            text: UniqueMessage
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
            userActivePermissions: UserPermissionNames.union[],
            text: UniqueMessage
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

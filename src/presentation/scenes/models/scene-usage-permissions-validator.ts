import { BotContent } from 'src/entities/bot-content'
import { UserProfile } from 'src/entities/user-profile'
import { PermissionsValidationResult } from './scene.interface'

export namespace SceneUsagePermissionsValidator {
    export interface IPermissionsValidator {
        validateUseScenePermissions(
            accessRules: UserProfile.AccessRules,
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult
    }

    export class CanUseIfNotBanned implements IPermissionsValidator {
        validateUseScenePermissions(
            accessRules: UserProfile.AccessRules,
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult {
            return accessRules.isBanned
                ? {
                      canUseScene: false,
                      validationErrorMessage: text.common.bannedUserMessage,
                  }
                : { canUseScene: true }
        }
    }

    export class OwnerOrAdminOnly implements IPermissionsValidator {
        validateUseScenePermissions(
            accessRules: UserProfile.AccessRules,
            text: BotContent.UniqueMessage
        ): PermissionsValidationResult {
            return {
                canUseScene: accessRules.canAccessAdminMenu,
            }
        }
    }
}

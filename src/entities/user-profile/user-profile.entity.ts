import { _UserProfileFormatter } from './user-profile.formatter'
import { _UserProfileHelper } from './user-profile.helper'
import { _UserProfileInternalInfo } from './nested/internal-info.entity'
import { _UserProfilePermissionNames } from './nested/permission-names.enum'

/**
 * Namespace for UserProfile entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _UserProfileEntity {
    export import Helper = _UserProfileHelper
    export import Formatter = _UserProfileFormatter

    export type BaseType = {
        telegramId: number
        telegramTopic?: TelegramTopicInfo
        telegramInfo: TelegramInfo
        sceneData: SceneData
        internalInfo: InternalInfo.BaseType
    }

    export import InternalInfo = _UserProfileInternalInfo
    export import PermissionNames = _UserProfilePermissionNames

    export type TelegramTopicInfo = {
        chatId: number
        messageThreadId: number
    }

    export type TelegramInfo = {
        id: number
        is_bot: boolean
        first_name: string
        last_name?: string
        username?: string
        language_code?: string
    }

    export type SceneData = {
        sceneName?: string
        data?: object
    }
}

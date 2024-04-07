import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserHistoryEvent } from 'src/business-logic/user/enums/user-history-event.enum'
import { _UserProfileFormatter } from './user-profile.formatter'
import { _UserProfileHelper } from './user-profile.helper'
import { _UserProfileInternalInfo } from './nested/internal-info.entity'

/**
 * Namespace for UserProfile entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _UserProfileEntity {
    export import Helper = _UserProfileHelper
    export import Formatter = _UserProfileFormatter

    export type BaseType = {
        telegramId: number
        telegramInfo: TelegramInfo
        sceneData: SceneData
        internalInfo: InternalInfo.BaseType
        userHistory: UserHistoryRecord[]
    }

    export import InternalInfo = _UserProfileInternalInfo

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

    export type UserHistoryRecord = {
        timeStamp: Date
        event: UserHistoryEvent
        content?: object | string
    }
}

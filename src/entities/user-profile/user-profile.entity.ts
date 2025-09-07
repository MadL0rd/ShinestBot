import { ReplyKeyboardMarkup } from 'telegraf/types'
import { StartParam } from '../start-param'
import { Survey } from '../survey'
import { _UserProfilePermissionNames } from './nested/permission-names.enum'
import { _TelegramTopic } from './nested/telegram-topic-info.entity'
import { _UserProfileFormatter } from './user-profile.formatter'
import { _UserProfileHelper } from './user-profile.helper'

/**
 * Namespace for UserProfile entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _UserProfileEntity {
    export import Helper = _UserProfileHelper
    export import Formatter = _UserProfileFormatter
    export import TelegramTopic = _TelegramTopic
    export import PermissionNames = _UserProfilePermissionNames

    export type BaseType = {
        readonly telegramId: number
        readonly createdAt: Date
        readonly updatedAt: Date
        isBotBlocked: boolean
        telegramUserIsDeactivated: boolean
        enableStartParamRewriting?: boolean
        unsuccessfulManagerNotificationsCount: number

        telegramTopic: TelegramTopic.BaseType | null
        telegramTopicHistory: TelegramTopic.BaseType[]
        telegramInfo: TelegramInfo
        sceneData: SceneData | null
        currentKeyboard?: ReplyKeyboardInfo | null

        startParam: StartParam.BaseType | null
        startParamString: string | null

        language: string | null
        permissions: Permission[]

        surveyAnswersCache: Survey.PassedAnswersCache | null
        trainingParagraphId: string | null
        lastContactWithModerator: LastContactWithModeratorInfo | null
    }

    export type TelegramInfo = {
        id: number
        is_bot: boolean
        first_name: string
        last_name?: string
        username?: string
        language_code?: string
    }

    export type ReplyKeyboardInfo =
        | {
              exists: true
              messageId: number
              replyMarkup: ReplyKeyboardMarkup
          }
        | {
              exists: false
          }

    export type SceneData = {
        sceneName: string
        data?: Record<string, unknown>
    }

    type LastContactWithModeratorInfo = {
        moderatorId?: number
        datetime?: Date
    }

    export type Permission = {
        permissionName: PermissionNames.Union | string
        comment?: string
        startDate: Date
        expirationDate?: Date
    }
}

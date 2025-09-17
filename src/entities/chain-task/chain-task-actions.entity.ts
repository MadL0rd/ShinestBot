import { UserProfile } from 'src/entities/user-profile'
import { ParseMode } from 'telegraf/types'

export namespace _ChainTask.Actions {
    export type SomeAction = TelegramAction
    export type ResourceType = SomeAction['resourceType']
    export type ActionsWithResourceType<Resource extends ResourceType> = Extract<
        SomeAction,
        { resourceType: Resource }
    >
    export type ActionsWithActionType<ActionType extends SomeAction['actionType']> = Extract<
        SomeAction,
        { actionType: ActionType }
    >

    export type TelegramAction = TelegramActionAny &
        (
            | TelegramCreateTopic
            | TelegramSendMessage
            | TelegramForwardMessages
            | TelegramSendTopicChangeLogs
            | TelegramResendMainMenuIfNeeded
        )

    type TelegramUserDialogTypeTopic = `topic${Capitalize<UserProfile.TelegramTopic.TopicType>}`

    export type TelegramActionAny = {
        resourceType: 'telegram'
    }

    export type TelegramCreateTopic = {
        actionType: 'createTopic'
        topicType: UserProfile.TelegramTopic.TopicType
    }

    export type TelegramSendTopicChangeLogs = {
        actionType: 'sendTopicChangeLogs'
    }

    export type TelegramSendMessage = {
        actionType: 'sendMessage'
        dialogType: 'privateDialog' | TelegramUserDialogTypeTopic
        data:
            | { type: 'text'; text: string; parseMode?: ParseMode | undefined }
            | { type: 'video'; videoId: string; caption: string }
    }

    export type TelegramForwardMessages = {
        actionType: 'forwardPrivateMessagesToTopic'
        dialogType: TelegramUserDialogTypeTopic
        forwardFromChatId: number | string
        forwardMessageIds: number[]
    }

    export type TelegramResendMainMenuIfNeeded = {
        actionType: 'resendMainMenuIfNeeded'
    }
}

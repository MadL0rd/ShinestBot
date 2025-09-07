import { swapFn } from 'src/utils/swap-fn'

export namespace _TelegramTopic {
    export type BaseType = {
        type: TopicType
        topicId: TopicId
        chatId: number
        messageThreadId: number
        creationDate: Date
    }

    export type TopicType = 'default'

    export type TopicId = ActiveTopicId | LegacyTopicId
    export type ActiveTopicId = 'default-v0'
    export type LegacyTopicId = never

    export const activeIdByType = {
        default: 'default-v0',
    } as const satisfies Record<TopicType, ActiveTopicId>
    export const typeByActiveId = swapFn(activeIdByType)
}

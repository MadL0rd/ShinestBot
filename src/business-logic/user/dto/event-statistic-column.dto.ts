import { DeepPartial } from 'src/entities/common/deep-partial.type'
import { UserHistoryEvent } from '../enums/user-history-event.enum'

export type EventFilter<EventName extends UserHistoryEvent.EventTypeName> = DeepPartial<
    UserHistoryEvent.SomeEventType<EventName>
> &
    Pick<UserHistoryEvent.SomeEventType<EventName>, 'type'>
export type SomeEventFilter = EventFilter<UserHistoryEvent.EventTypeName>

export type SomeEventStatisticColumnDto = {
    readonly type: 'data'
    readonly columnTitle: string

    readonly event: SomeEventFilter
    readonly eventCacheId?: string
}

export type SomeEventsPercentageStatisticColumnDto = {
    readonly type: 'percentage'
    readonly columnTitle: string

    readonly eventTotal: SomeEventFilter
    readonly eventTotalCacheId?: string

    readonly eventSubset: SomeEventFilter
    readonly eventSubsetCacheId?: string
}

export type StatisticColumnDto =
    | SomeEventStatisticColumnDto
    | SomeEventsPercentageStatisticColumnDto
    | { readonly type: 'spacer' }

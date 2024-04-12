import { DistributiveOmit } from 'src/entities/common/distributive-omit.type'
import { eventsSchema } from './user-history-events'

export namespace UserHistoryEvent {
    // Content schemas
    export const schemaEvents = eventsSchema
    export type EventTypeName = keyof typeof schemaEvents
    export type AnyEventType = (typeof schemaEvents)[EventTypeName]

    export type SomeEventType<EventName extends EventTypeName> = DistributiveOmit<
        (typeof schemaEvents)[EventName],
        'localizedTitle'
    >
}

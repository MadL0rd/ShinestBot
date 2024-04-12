export namespace _Placement {
    export type BaseType = PlacementTelegram

    type PlacementTelegram = {
        type: 'telegram'
        creationDate: Date
        channelId: number
        messageId: number
    }
}

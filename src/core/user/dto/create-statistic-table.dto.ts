import { UserHistoryEvent } from '../enums/user-history-event.enum'
import { AgregationType } from '../enums/agregation-type.enum'

export class CreateStatisticTableDto {
    readonly event: UserHistoryEvent
    readonly agregationType: AgregationType
    readonly tableTitle?: string
}

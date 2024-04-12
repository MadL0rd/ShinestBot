import { Survey } from '../survey'
import { _Placement } from './nested/placment'
import { _PublicationStatus } from './nested/publication-status'
import { _PublicationFormatter } from './publication.formatter'
import { _PublicationHelper } from './publication.helper'

/**
 * Namespace for Publication entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _PublicationEntity {
    export import Helper = _PublicationHelper
    export import Formatter = _PublicationFormatter
    export import Placement = _Placement
    export import PublicationStatus = _PublicationStatus

    export type BaseType = {
        userTelegramId: number
        creationDate: Date
        language: string
        answers: Survey.PassedAnswer[]
        status: PublicationStatus.Union
        moderationChatThreadMessageId?: number
        moderationChannelPublicationId?: number
        placementHistory: Placement.BaseType[]
    }
}

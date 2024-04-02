import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { PublicationStatus } from '../enums/publication-status.enum'
import { HydratedDocument } from 'mongoose'

@Schema()
export class Publication {
    @Prop()
    userTelegramId: number

    @Prop()
    creationDate: Date

    @Prop()
    language: string

    @Prop()
    answers: Survey.PassedAnswer[]

    @Prop()
    status: PublicationStatus.Union

    @Prop()
    moderationChatThreadMessageId?: number

    @Prop()
    moderationChannelPublicationId?: number

    @Prop()
    placementHistory: Placement[]
}

type PlacementTelegram = {
    type: 'telegram'
    channelId: number
    messageId: number
}

type Placement = PlacementTelegram

export const PublicationSchema = SchemaFactory.createForClass(Publication)
export type PublicationDocument = HydratedDocument<Publication>

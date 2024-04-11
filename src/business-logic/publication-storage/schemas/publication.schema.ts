import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Survey } from 'src/entities/survey'
import { PublicationEntity } from 'src/entities/publication'

@Schema()
export class Publication implements PublicationEntity.BaseType {
    @Prop()
    userTelegramId: number

    @Prop()
    creationDate: Date

    @Prop()
    language: string

    @Prop()
    answers: Survey.PassedAnswer[]

    @Prop()
    status: PublicationEntity.PublicationStatus.Union

    @Prop()
    moderationChatThreadMessageId?: number

    @Prop()
    moderationChannelPublicationId?: number

    @Prop()
    placementHistory: PublicationEntity.Placement.BaseType[]
}

export const PublicationSchema = SchemaFactory.createForClass(Publication)
export type PublicationDocument = HydratedDocument<Publication>

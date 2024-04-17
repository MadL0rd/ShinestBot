import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Survey } from 'src/entities/survey'
import { Publication } from 'src/entities/publication'
import { MongoDocument } from 'src/entities/common/mongo-document.type'

@Schema({ collection: 'publications' })
export class PublicationSchema implements Publication.BaseType {
    @Prop()
    userTelegramId: number

    @Prop()
    creationDate: Date

    @Prop()
    language: string

    @Prop()
    answers: Survey.PassedAnswer[]

    @Prop()
    status: Publication.PublicationStatus.Union

    @Prop()
    moderationChatThreadMessageId?: number

    @Prop()
    moderationChannelPublicationId?: number

    @Prop()
    placementHistory: Publication.Placement.BaseType[]
}

export const publicationSchema = SchemaFactory.createForClass(PublicationSchema)
export type PublicationDocument = MongoDocument<PublicationSchema>

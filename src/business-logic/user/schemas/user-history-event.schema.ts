import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { UserHistoryEvent } from '../enums/user-history-event.enum'
import { DistributiveOmit } from 'src/entities/common/distributive-omit.type'

export type UserHistoryEventModel = DistributiveOmit<
    UserHistoryEvent.AnyEventType,
    'localizedTitle'
> & {
    date: Date
}

@Schema({ collection: 'user-events-history' })
export class UserEventsHistorySchema {
    @Prop()
    telegramId: number

    @Prop()
    userProfileId: string

    // @Prop({ type: mongoose.Schema.Types.Mixed })
    @Prop()
    eventsHistory: UserHistoryEventModel[]
}

export type UserEventsHistoryDocument = MongoDocument<UserEventsHistorySchema>
export const userEventsHistorySchema = SchemaFactory.createForClass(UserEventsHistorySchema)

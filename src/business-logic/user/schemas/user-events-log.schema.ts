import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { UserHistoryEvent } from '../enums/user-history-event.enum'

export const userEventsLogVersionSchema = new MongooseMigrations.VersionTagSchema({
    currentVersion: 'v1',
    legacyVersions: [],
})

@Schema({ collection: 'user-events-log' })
export class UserEventsLogSchema {
    @Prop(userEventsLogVersionSchema.schemaTypeOptions)
    migrationsVersion?: MongooseMigrations.inferVersionTagType<typeof userEventsLogVersionSchema>

    @Prop({ type: mongoose.Schema.Types.Number, index: true })
    telegramId: number

    @Prop({ type: mongoose.Schema.Types.String, index: true })
    type: UserHistoryEvent.EventTypeName

    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    date: Date

    @Prop({ type: mongoose.Schema.Types.Mixed })
    eventData: UserHistoryEvent.BaseType
}

export type UserEventsLogDocument = MongoDocument<UserEventsLogSchema>
export const userEventsLogSchema = SchemaFactory.createForClass(UserEventsLogSchema)

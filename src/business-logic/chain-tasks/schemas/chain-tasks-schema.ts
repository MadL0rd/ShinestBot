import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { ChainTask } from 'src/entities/chain-task'
import { MongoDocument } from 'src/entities/common/mongo-document.type'

export const chainTaskVersionSchema = new MongooseMigrations.VersionTagSchema({
    currentVersion: 'v1',
    legacyVersions: [],
})

@Schema({ collection: 'chain-tasks' })
export class ChainTaskSchema implements ChainTask.BaseType {
    @Prop(chainTaskVersionSchema.schemaTypeOptions)
    migrationsVersion: MongooseMigrations.inferVersionTagType<typeof chainTaskVersionSchema>

    @Prop({ type: mongoose.Schema.Types.Number, required: true, index: true })
    userTelegramId: number

    @Prop({ type: mongoose.Schema.Types.Date, required: true, index: true })
    creationDate: Date

    @Prop({ type: mongoose.Schema.Types.Date, required: true })
    updateDate: Date

    @Prop({ type: mongoose.Schema.Types.Number, required: true, index: true })
    order: number

    @Prop({
        type: mongoose.Schema.Types.String,
        required: true,
        index: true,
        enum: ['pending', 'issued'],
        default: 'pending',
    })
    state: 'pending' | 'issued'

    @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
    action: ChainTask.Actions.SomeAction
}

export const chainTaskSchema = SchemaFactory.createForClass(ChainTaskSchema)
export type ChainTaskDocument = MongoDocument<
    ChainTaskDocumentWithResource<ChainTask.Actions.ResourceType>
>
export type ChainTaskDocumentWithResource<ResourceType extends ChainTask.Actions.ResourceType> = {
    [Prop in keyof ChainTaskSchema]: Prop extends 'action'
        ? ChainTask.Actions.ActionsWithResourceType<ResourceType>
        : ChainTaskSchema[Prop]
}

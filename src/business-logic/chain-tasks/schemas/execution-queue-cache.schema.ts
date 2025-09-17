import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongoDocument } from 'src/entities/common/mongo-document.type'

@Schema({ collection: 'execution-queue-config-cache' })
export class ExecutionQueueConfigCacheSchema {
    @Prop({
        type: mongoose.Schema.Types.Array,
        isRequired: true,
        default: [],
    })
    issuedUserTelegramIds: number[]

    @Prop({
        type: mongoose.Schema.Types.Boolean,
        isRequired: true,
        default: false,
    })
    queuePaused: boolean
}

export const executionQueueConfigCacheSchema = SchemaFactory.createForClass(
    ExecutionQueueConfigCacheSchema
)
export type ExecutionQueueConfigCacheDocument = MongoDocument<ExecutionQueueConfigCacheSchema>

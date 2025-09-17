import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ChainTasksService } from './chain-tasks.service'
import { chainTaskSchema, ChainTaskSchema } from './schemas/chain-tasks-schema'
import {
    ExecutionQueueConfigCacheSchema,
    executionQueueConfigCacheSchema,
} from './schemas/execution-queue-cache.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: ChainTaskSchema.name,
                schema: chainTaskSchema,
            },
            {
                name: ExecutionQueueConfigCacheSchema.name,
                schema: executionQueueConfigCacheSchema,
            },
        ]),
    ],
    providers: [ChainTasksService],
    exports: [ChainTasksService],
})
export class ChainTasksModule {}

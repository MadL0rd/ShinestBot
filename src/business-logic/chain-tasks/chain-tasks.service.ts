import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Model } from 'mongoose'
import { logger } from 'src/app/app.logger'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { objectToMongooseFilter } from 'src/utils/object-to-mongoose-filter'
import { ChainTaskCreateDto } from './dto/chain-task.dto'
import {
    ChainTaskDocument,
    ChainTaskSchema,
    chainTaskVersionSchema,
} from './schemas/chain-tasks-schema'
import {
    ExecutionQueueConfigCacheDocument,
    ExecutionQueueConfigCacheSchema,
} from './schemas/execution-queue-cache.schema'

@Injectable()
export class ChainTasksService implements OnModuleInit {
    private configCache: ExecutionQueueConfigCacheDocument | ExecutionQueueConfigCacheSchema
    private orderCounter: { dateTime: number; count: number }

    constructor(
        @InjectModel(ExecutionQueueConfigCacheSchema.name)
        private readonly modelExecutionCache: Model<ExecutionQueueConfigCacheDocument>,

        @InjectModel(ChainTaskSchema.name)
        private readonly model: Model<ChainTaskDocument>,

        private eventEmitter: EventEmitter2
    ) {
        this.configCache = { issuedUserTelegramIds: [], queuePaused: false }
        this.orderCounter = { dateTime: new Date().getTime(), count: 0 }
    }

    async onModuleInit() {
        await this.invalidateInMemoryConfigCache().catch((e) =>
            logger.error(`invalidateInMemoryConfigCache failed`, e)
        )

        await this.runMigrations()
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    private async invalidateInMemoryConfigCache() {
        let cacheDoc: ExecutionQueueConfigCacheDocument | null = await this.modelExecutionCache
            .findOne({})
            .lean()
        if (!cacheDoc) {
            cacheDoc = await this.modelExecutionCache.create({}).then((doc) => doc.toObject())
        }
        if (!cacheDoc) throw Error('Fail to get ExecutionQueueCache')

        const configsAreEqual =
            cacheDoc.queuePaused === this.configCache.queuePaused &&
            cacheDoc.issuedUserTelegramIds.length ===
                this.configCache.issuedUserTelegramIds.length &&
            cacheDoc.issuedUserTelegramIds.every(
                (value, index) => value === this.configCache.issuedUserTelegramIds[index]
            )
        this.configCache = cacheDoc

        if (!configsAreEqual) this.sendEventConfigUpdated()
    }

    @Cron(CronExpression.EVERY_HOUR)
    async clearIssuedUserTelegramIds() {
        this.configCache.issuedUserTelegramIds = []
        const cacheDoc = await this.modelExecutionCache.findOne({})
        if (!cacheDoc) return
        cacheDoc.issuedUserTelegramIds = []
        await cacheDoc.save()

        this.sendEventConfigUpdated()
    }

    async toggleExecutionQueuePause() {
        this.configCache.queuePaused = !this.configCache.queuePaused
        const cacheDoc = await this.modelExecutionCache.findOne({})
        if (!cacheDoc) return
        cacheDoc.queuePaused = this.configCache.queuePaused
        await cacheDoc.save()

        this.sendEventConfigUpdated()
    }

    private generateOrderForCreationDate(dateTime: number): number {
        if (dateTime > this.orderCounter.dateTime) {
            this.orderCounter.dateTime = dateTime
            this.orderCounter.count = 0
            return 0
        }
        if (dateTime === this.orderCounter.dateTime) {
            this.orderCounter.count += 1
            return this.orderCounter.count
        }

        logger.error('Chain task creation dateTime lower then previous stored value!')
        return 100
    }

    private async create(dto: ChainTaskCreateDto) {
        const date = new Date()
        const result = await this.model.create({
            migrationsVersion: chainTaskVersionSchema.currentVersion,
            creationDate: date,
            updateDate: date,
            order: this.generateOrderForCreationDate(date.getTime()),
            state: 'pending',
            ...dto,
        })
        return result.toObject()
    }

    async addTask(dto: ChainTaskCreateDto) {
        await this.create(dto)
        this.sendEventChainTaskCreated(dto.userTelegramId)
    }

    async addTaskIfSameDoesNotExists(dto: ChainTaskCreateDto) {
        const date = new Date()
        const filter = objectToMongooseFilter(dto)

        const result = await this.model.updateOne(
            filter,
            {
                $setOnInsert: {
                    migrationsVersion: chainTaskVersionSchema.currentVersion,
                    creationDate: date,
                    updateDate: date,
                    order: this.generateOrderForCreationDate(date.getTime()),
                    state: 'pending',
                    ...dto,
                },
            },
            { upsert: true }
        )

        if (result.upsertedCount !== 0) this.sendEventChainTaskCreated(dto.userTelegramId)
    }

    async addTasks(dto: { onlyIfSameDoesNotExists: boolean; tasks: ChainTaskCreateDto[] }) {
        if (dto.tasks.isEmpty) return

        const date = new Date()
        const dateTime = date.getTime()

        if (dto.onlyIfSameDoesNotExists) {
            await this.model.bulkWrite(
                dto.tasks.map((task) => ({
                    updateOne: {
                        filter: objectToMongooseFilter(task),
                        update: {
                            $setOnInsert: {
                                migrationsVersion: chainTaskVersionSchema.currentVersion,
                                creationDate: date,
                                updateDate: date,
                                order: this.generateOrderForCreationDate(dateTime),
                                state: 'pending',
                                ...task,
                            },
                        },
                        upsert: true,
                    },
                }))
            )
        } else {
            await this.model.insertMany(
                dto.tasks.map((task) => ({
                    migrationsVersion: chainTaskVersionSchema.currentVersion,
                    creationDate: date,
                    updateDate: date,
                    order: this.generateOrderForCreationDate(dateTime),
                    state: 'pending',
                    ...task,
                }))
            )
        }

        const telegramIds = dto.tasks.map((task) => task.userTelegramId).uniqueOnly
        for (const telegramId of telegramIds) {
            this.sendEventChainTaskCreated(telegramId)
        }
    }

    async checkThereIsAtLeastOnePendingTask() {
        return this.model
            .exists({
                userTelegramId: { $nin: this.configCache.issuedUserTelegramIds },
            })
            .then(Boolean)
    }

    async getActivePendingTasks(limit: number = 10): Promise<ChainTaskDocument[]> {
        if (this.configCache.queuePaused === true) return []
        return await this.model
            .find({
                userTelegramId: { $nin: this.configCache.issuedUserTelegramIds },
            })
            .sort({
                creationDate: 1,
                order: 1,
            })
            .limit(limit)
            .lean()
    }

    async getActivePendingTasksUserTelegramIds() {
        if (this.configCache.queuePaused === true) return []

        return this.model.distinct('userTelegramId', {
            userTelegramId: { $nin: this.configCache.issuedUserTelegramIds },
        })
    }

    async getActivePendingTasksForUser(
        userTelegramId: number,
        limit: number = 10
    ): Promise<ChainTaskDocument[]> {
        if (
            this.configCache.queuePaused ||
            this.configCache.issuedUserTelegramIds.includes(userTelegramId)
        ) {
            return []
        }

        return await this.model
            .find({ userTelegramId })
            .sort({
                creationDate: 1,
                order: 1,
            })
            .limit(limit)
            .lean()
    }

    async setUserTasksStateIssued(userTelegramId: number) {
        this.configCache.issuedUserTelegramIds.push(userTelegramId)

        await this.modelExecutionCache.updateOne({}, this.configCache)

        const update: Partial<ChainTaskSchema> = {
            state: 'issued',
            updateDate: new Date(),
        }
        const result = await this.model
            .updateMany({ userTelegramId: userTelegramId }, update)
            .lean()

        return result.acknowledged
    }

    async deleteById(id: string) {
        return this.model
            .deleteOne({ _id: id })
            .lean()
            .then((result) => result.deletedCount === 1)
    }

    async getUserTasksQueueInfo(userTelegramId: number) {
        return {
            isIssued: this.configCache.issuedUserTelegramIds.includes(userTelegramId),
            count: await this.model.countDocuments({
                userTelegramId: userTelegramId,
            }),
        }
    }

    async getTasksQueueInfo() {
        return {
            config: this.configCache,
            totalTasksCount: await this.model.countDocuments(),
            issuedTasksCount: await this.model.countDocuments({
                userTelegramId: { $in: this.configCache.issuedUserTelegramIds },
            }),
        }
    }

    private sendEventChainTaskCreated(userTelegramId: number) {
        this.eventEmitter.emit('chainTask.created', { userTelegramId })
    }

    private sendEventConfigUpdated() {
        this.eventEmitter.emit('chainTask.configUpdated')
    }

    private async runMigrations() {
        const assistant = new MongooseMigrations.Assistant({
            model: this.model,
            documentVersionKey: 'migrationsVersion',
            currentVersion: chainTaskVersionSchema.currentVersion,
            legacyVersions: chainTaskVersionSchema.legacyVersions,
            migrationsConfiguration: {},
            logger: logger,
        })
        await assistant.runMigrations()
    }
}

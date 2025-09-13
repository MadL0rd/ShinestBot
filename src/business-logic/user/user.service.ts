import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { logger } from 'src/app/app.logger'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { OmitFields } from 'src/entities/common/utility-types-extensions'
import { pickFields } from 'src/utils/pick-fields'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserHistoryEvent } from './enums/user-history-event.enum'
import {
    UserProfileDocument,
    UserProfileSchema,
    userProfileVersionSchema,
} from './schemas/user.schema'
import { UserEventsLogRepository } from './user-events-log.repo'

@Injectable()
export class UserService implements OnModuleInit {
    constructor(
        @InjectModel(UserProfileSchema.name)
        private readonly userModel: Model<UserProfileDocument>,
        private readonly userLogsRepo: UserEventsLogRepository
    ) {}

    async onModuleInit() {
        await this.runMigrations()
    }

    async createIfNeededAndGet(createUserDto: CreateUserDto): Promise<UserProfileDocument> {
        const existingUser = await this.findOneByTelegramId(createUserDto.telegramId)
        if (existingUser) return existingUser

        const { upsertSuccess, createdUser } = await this.userModel
            .updateOne(
                { telegramId: createUserDto.telegramId },
                {
                    $setOnInsert: createUserDto,
                },
                { upsert: true }
            )
            .lean()
            .then(async (result) => ({
                upsertSuccess: Boolean(result.upsertedCount),
                createdUser: result.upsertedId
                    ? await this.userModel.findById(result.upsertedId).lean()
                    : await this.userModel.findOne({ telegramId: createUserDto.telegramId }).lean(),
            }))

        if (!createdUser) {
            throw Error(`User creation failed. Telegram id: ${createUserDto.telegramId}`)
        }
        if (upsertSuccess) {
            this.logToUserHistory(createdUser, {
                type: 'userCreated',
                startParam: createdUser.startParam ?? null,
                startParamString: createdUser.startParamString ?? null,
            })
        }
        return createdUser
    }

    async update(
        updateUserDto: UpdateUserDto,
        updateOnly?: (keyof OmitFields<UpdateUserDto, 'telegramId'>)[]
    ): Promise<UserProfileDocument | null> {
        const dto = updateOnly ? pickFields(updateUserDto, updateOnly) : updateUserDto
        const result = await this.userModel
            .findOneAndUpdate({ telegramId: updateUserDto.telegramId }, dto, {
                returnOriginal: false,
                returnDocument: 'after',
            })
            .lean()
        return result
    }

    async exists(telegramId: number): Promise<boolean> {
        return this.userModel.exists({ telegramId: telegramId }).lean().then(Boolean)
    }

    async findOneByTelegramId(telegramId: number): Promise<UserProfileDocument | null> {
        return this.userModel.findOne({ telegramId: telegramId }).lean()
    }

    async findOneByForumTopic(
        chatId: number,
        threadId: number
    ): Promise<UserProfileDocument | null> {
        return this.userModel
            .findOne({
                'telegramTopic.chatId': chatId,
                'telegramTopic.messageThreadId': threadId,
            })
            .lean()
            .exec()
    }

    async findOneByAnyTopic(
        chatId: number,
        messageThreadId: number
    ): Promise<UserProfileDocument | null> {
        return this.userModel
            .findOne({
                $or: [
                    {
                        'telegramTopic.chatId': chatId,
                        'telegramTopic.messageThreadId': messageThreadId,
                    },
                    {
                        telegramTopicHistory: {
                            $elemMatch: {
                                chatId,
                                messageThreadId,
                            },
                        },
                    },
                ],
            })
            .lean()
            .exec()
    }

    async findByTelegramUsername(telegramUsername: string): Promise<UserProfileDocument | null> {
        if (telegramUsername.startsWith('@')) {
            telegramUsername = telegramUsername.replace('@', '')
        }
        logger.log(`telegramUsername: ${telegramUsername}`)
        return this.userModel.findOne({ 'telegramInfo.username': telegramUsername }).lean().exec()
    }

    async findAllTelegramIds(): Promise<number[]> {
        const users = await this.userModel.find({}).select({ telegramId: 1 }).lean().exec()
        const ids = users.map((user) => user.telegramId)
        return ids
    }

    async logToUserHistory<EventName extends UserHistoryEvent.EventTypeName>(
        user: { telegramId: number },
        event: UserHistoryEvent.SomeEventType<EventName>
    ): Promise<void> {
        return await this.userLogsRepo.logUserEvent(user, event)
    }

    private async runMigrations() {
        const assistant = new MongooseMigrations.Assistant({
            model: this.userModel,
            documentVersionKey: 'migrationsVersion',
            currentVersion: userProfileVersionSchema.currentVersion,
            legacyVersions: userProfileVersionSchema.legacyVersions,
            migrationsConfiguration: {},
            logger: logger,
        })
        await assistant.runMigrations()
    }
}

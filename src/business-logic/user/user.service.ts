import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { logger } from 'src/app/app.logger'
import { UserHistoryEvent } from './enums/user-history-event.enum'
import { UserProfileDocument, UserProfileSchema } from './schemas/user.schema'
import {
    UserEventsHistorySchema,
    UserEventsHistoryDocument,
    UserHistoryEventModel,
} from './schemas/user-history-event.schema'
import { CreateUserEventsHistory } from './dto/create-user-events-history.dto'

@Injectable()
export class UserService {
    constructor(
        @InjectModel(UserProfileSchema.name) private readonly userModel: Model<UserProfileDocument>,
        @InjectModel(UserEventsHistorySchema.name)
        private modelHistory: Model<UserEventsHistoryDocument>
    ) {}

    async createIfNeededAndGet(createUserDto: CreateUserDto): Promise<UserProfileDocument> {
        const existingUser = await this.findOneByTelegramId(createUserDto.telegramId)
        if (existingUser) {
            return existingUser
        }

        const createdUser = await this.userModel.create(createUserDto)
        await this.logToUserHistory(createdUser, {
            type: 'start',
            startParam: createdUser.internalInfo.startParam,
        })
        logger.log('Create user', createUserDto)
        return createdUser
    }

    async update(updateUserDto: UpdateUserDto): Promise<UserProfileDocument | null> {
        return this.userModel
            .findOneAndUpdate({ telegramId: updateUserDto.telegramId }, updateUserDto)
            .lean()
            .exec()
    }

    async findOneByTelegramId(telegramId: number): Promise<UserProfileDocument | null> {
        return this.userModel
            .findOne({ telegramId: telegramId })
            .select({ userHistory: 0 })
            .lean()
            .exec()
    }

    async findOneById(id: string): Promise<UserProfileDocument | null> {
        try {
            const user = await this.userModel.findById(id).exec()
            return user
        } catch (error) {
            logger.warn(`User with _id ${id} not found`)
            return null
        }
    }

    async findByTelegramUsername(telegramUsername: string): Promise<UserProfileDocument | null> {
        if (telegramUsername.includes('@', 0)) {
            telegramUsername = telegramUsername.replace('@', '')
        }
        logger.log(`telegramUsername: ${telegramUsername}`)
        return this.userModel
            .findOne({ 'telegramInfo.username': telegramUsername })
            .select({ userHistory: 0 })
            .lean()
            .exec()
    }

    //=====
    // Get users
    //=====

    async findAllTelegramIds(): Promise<number[]> {
        const users = await this.userModel.find({}).select({ telegramId: 1 }).lean().exec()
        const ids = users.map((user) => user.telegramId)
        return ids
    }

    async findAll(): Promise<UserProfileDocument[]> {
        return this.userModel.find({}).select({ userHistory: 0 }).lean().exec()
    }

    //=====
    // Get user history from User document
    //=====

    async createUserEventsHistoryDocument(
        dto: CreateUserEventsHistory
    ): Promise<UserEventsHistoryDocument> {
        return await this.modelHistory.create(dto)
    }

    async logToUserHistory<EventName extends UserHistoryEvent.EventTypeName>(
        user: UserProfileDocument,
        event: UserHistoryEvent.SomeEventType<EventName>
    ): Promise<void> {
        const eventModel: UserHistoryEventModel = { ...event, date: new Date() }

        const existingRecord = await this.modelHistory
            .findOne({ telegramId: user.telegramId })
            .select({ telegramId: 1 })
            .lean()
            .exec()
        if (!existingRecord) {
            await this.createUserEventsHistoryDocument({
                telegramId: user.telegramId,
                userProfileId: user._id.toString(),
                eventsHistory: [],
            })
        }

        await this.modelHistory
            .updateOne(
                { telegramId: user.telegramId },
                { $push: { eventsHistory: eventModel } },
                { lean: true, new: true }
            )
            .exec()
    }

    async findUserHistoryByTelegramId(
        telegramId: number
    ): Promise<UserEventsHistoryDocument | null> {
        return await this.modelHistory
            .findOne({ telegramId: telegramId })
            .select({ userHistory: 1 })
            .lean()
            .exec()
    }
}

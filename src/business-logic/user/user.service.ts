import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { logger } from 'src/app/app.logger'
import { UserHistoryEvent } from './enums/user-history-event.enum'
import { UserProfileDocument, UserProfileSchema } from './schemas/user.schema'
import { UserProfile } from 'src/entities/user-profile'

@Injectable()
export class UserService {
    constructor(
        @InjectModel(UserProfileSchema.name) private userModel: Model<UserProfileDocument>
    ) {}

    async createIfNeededAndGet(createUserDto: CreateUserDto): Promise<UserProfileDocument> {
        const existingUser = await this.findOneByTelegramId(createUserDto.telegramId)
        if (existingUser) {
            return existingUser
        }

        const createdUser = new this.userModel(createUserDto)
        await this.logToUserHistory(
            createdUser,
            UserHistoryEvent.start,
            'Начало сохранения истории пользователя'
        )
        logger.log('Create user', createUserDto)
        return createdUser
    }

    async update(updateUserDto: UpdateUserDto): Promise<UserProfileDocument | null> {
        return this.userModel
            .findOneAndUpdate({ telegramId: updateUserDto.telegramId }, updateUserDto)
            .lean()
            .exec()
    }

    //=====
    // Get User document without user history
    //=====
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
    async findUserHistoryByTelegramId(
        telegramId: number
    ): Promise<UserProfile.UserHistoryRecord[]> {
        const result = await this.userModel
            .findOne({ telegramId: telegramId })
            .select({ userHistory: 1 })
            .lean()
            .exec()
        return result?.userHistory ?? []
    }

    async logToUserHistory(
        user: UserProfileDocument,
        event: UserHistoryEvent,
        content?: object | string
    ): Promise<void> {
        const historyStep: UserProfile.UserHistoryRecord = {
            timeStamp: new Date(),
            event: event,
            content: content,
        }
        /*let existingHistory = await this.findUserHistoryByTelegramId(user.telegramId)
        existingHistory ? existingHistory.push(historyStep) : (existingHistory = [historyStep])
        user.userHistory = existingHistory
        await user.save()*/

        await this.userModel
            .updateOne(
                { telegramId: user.telegramId },
                { $push: { userHistory: historyStep } },
                { lean: true, new: true }
            )
            .exec()
    }
}

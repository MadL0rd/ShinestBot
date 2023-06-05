import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateUserDto } from './dto/create-user.dto'
import { User, UserDocument, UserHistoryRecord } from './schemas/user.schema'
import { UpdateUserDto } from './dto/update-user.dto'
import { logger } from 'src/app.logger'
import { UserHistoryEvent } from './enums/user-history-event.enum'

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async createIfNeededAndGet(createUserDto: CreateUserDto): Promise<UserDocument> {
        const existingUser = await this.findByTelegramId(createUserDto.telegramId)
        if (existingUser) {
            return existingUser
        }

        const createdUser = new this.userModel(createUserDto)
        await createdUser.save()
        await this.logToUserHistory(
            createdUser,
            UserHistoryEvent.start,
            'Начало сохранения истории пользователя'
        )
        logger.log('Create user', createUserDto)
        return createdUser
    }

    async update(updateUserDto: UpdateUserDto): Promise<UserDocument> {
        logger.debug(`Update user`, updateUserDto)
        return this.userModel
            .findOneAndUpdate({ telegramId: updateUserDto.telegramId }, updateUserDto)
            .exec()
    }

    //=====
    // Get User document without user history
    //=====
    async findByTelegramId(telegramId: number): Promise<UserDocument> {
        return this.userModel.findOne({ telegramId: telegramId }).select({ userHistory: 0 }).exec()
    }

    //=====
    // Get user history from User document
    //=====
    async findUserHistoryByTelegramId(telegramId: number): Promise<UserHistoryRecord[]> {
        const result = await this.userModel
            .findOne({ telegramId: telegramId })
            .select({ userHistory: 1 })
            .exec()
        return result.userHistory
    }

    async logToUserHistory(
        user: UserDocument,
        event: UserHistoryEvent,
        content?: string
    ): Promise<void> {
        const historyStep: UserHistoryRecord = {
            timeStamp: new Date(),
            event: event,
            content: content,
        }
        let existingHistory = await this.findUserHistoryByTelegramId(user.telegramId)
        existingHistory ? existingHistory.push(historyStep) : (existingHistory = [historyStep])
        user.userHistory = existingHistory
        await user.save()
    }
}

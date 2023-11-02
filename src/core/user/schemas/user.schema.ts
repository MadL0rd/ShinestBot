import { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserHistoryEvent as UserHistoryEvent } from '../enums/user-history-event.enum'
import { UserInternalInfo } from './models/user.internal-info'

export type UserDocument = HydratedDocument<User>

export class TelegramInfo {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

export class SceneData {
    sceneName?: string
    data?: object
}

export class UserHistoryRecord {
    timeStamp: Date
    event: UserHistoryEvent
    content?: string
}

@Schema()
export class User {
    @Prop()
    telegramId: number

    @Prop()
    telegramInfo: TelegramInfo

    @Prop()
    sceneData: SceneData

    @Prop()
    internalInfo: UserInternalInfo

    @Prop()
    userHistory: UserHistoryRecord[]
}

export const UserSchema = SchemaFactory.createForClass(User)

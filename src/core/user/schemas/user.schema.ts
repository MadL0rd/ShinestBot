import { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserHistoryEvent as UserHistoryEvent } from '../enums/user-history-event.enum'
import { LanguageSupportedKey } from 'src/core/bot-content/language-supported-key.enum'
import { UserPermissions } from '../enums/user-permissions.enum'

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

export class UserInternalInfo {
    readonly startParam?: string = null
    readonly language?: LanguageSupportedKey
    readonly permissions?: [UserPermission]
}

export class UserPermission {
    readonly permissionName: UserPermissions
    readonly startDate?: Date
    readonly expirationDate?: Date
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

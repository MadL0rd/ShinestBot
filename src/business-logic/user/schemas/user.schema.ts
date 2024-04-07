import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { MongoDocument } from 'src/entities/_common/mongo-document.type'
import { UserInternalInfo } from 'src/entities/user-profile/nested/user.internal-info'
import {
    TelegramInfo,
    SceneData,
    UserHistoryRecord,
    UserProfile,
} from 'src/entities/user-profile/user-profile.entity'

@Schema({ collection: 'users' })
export class UserSchema implements UserProfile {
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

export type UserDocument = MongoDocument<UserProfile>
export const userSchema = SchemaFactory.createForClass(UserSchema)

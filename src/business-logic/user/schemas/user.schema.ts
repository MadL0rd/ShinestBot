import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { UserProfile } from 'src/entities/user-profile'

@Schema({ collection: 'users' })
export class UserProfileSchema implements UserProfile.BaseType {
    @Prop()
    telegramId: number

    @Prop({ type: mongoose.Schema.Types.Mixed })
    telegramInfo: UserProfile.TelegramInfo

    @Prop({ type: mongoose.Schema.Types.Mixed })
    sceneData: UserProfile.SceneData

    @Prop({ type: mongoose.Schema.Types.Mixed })
    internalInfo: UserProfile.InternalInfo.BaseType
}

export type UserProfileDocument = MongoDocument<UserProfile.BaseType>
export const userProfileSchema = SchemaFactory.createForClass(UserProfileSchema)

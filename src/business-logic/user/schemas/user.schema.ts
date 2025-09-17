import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { StartParam } from 'src/entities/start-param'
import { Survey } from 'src/entities/survey'
import { UserProfile } from 'src/entities/user-profile'

export const userProfileVersionSchema = new MongooseMigrations.VersionTagSchema({
    currentVersion: 'v1',
    legacyVersions: [],
})

@Schema({
    collection: 'users',
    timestamps: true,
})
export class UserProfileSchema implements UserProfile.BaseType {
    @Prop(userProfileVersionSchema.schemaTypeOptions)
    migrationsVersion: MongooseMigrations.inferVersionTagType<typeof userProfileVersionSchema>

    @Prop({ type: mongoose.Schema.Types.Number, index: true, unique: true })
    telegramId: number

    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    readonly createdAt: Date
    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    readonly updatedAt: Date

    @Prop({ type: mongoose.Schema.Types.Boolean, required: true, default: false })
    isBotBlocked: boolean

    @Prop({ type: mongoose.Schema.Types.Boolean, required: true, default: false })
    telegramUserIsDeactivated: boolean

    @Prop({ type: mongoose.Schema.Types.Boolean, required: true, default: false })
    enableStartParamRewriting?: boolean

    @Prop({ type: mongoose.Schema.Types.Number, required: true, default: 0 })
    unsuccessfulManagerNotificationsCount: number

    @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
    telegramTopic: UserProfile.TelegramTopic.BaseType | null

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    telegramTopicHistory: UserProfile.TelegramTopic.BaseType[]

    @Prop({ type: mongoose.Schema.Types.Mixed })
    telegramInfo: UserProfile.TelegramInfo

    @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
    currentKeyboard: UserProfile.ReplyKeyboardInfo | null

    @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
    sceneData: UserProfile.SceneData | null

    @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
    startParam: StartParam.BaseType | null

    @Prop({ type: mongoose.Schema.Types.String, required: false, default: null })
    startParamString: string | null

    @Prop({ type: mongoose.Schema.Types.String, required: false, default: null })
    language: string | null

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    permissions: UserProfile.Permission[]

    @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
    surveyAnswersCache: Survey.PassedAnswersCache | null

    @Prop({ type: mongoose.Schema.Types.String, required: false, default: null })
    trainingParagraphId: string | null

    @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
    lastContactWithModerator: { moderatorId?: number; datetime?: Date } | null
}

export type UserProfileDocument = MongoDocument<UserProfileSchema>
export const userProfileSchema = SchemaFactory.createForClass(UserProfileSchema)

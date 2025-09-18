import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { UserProfile } from 'src/entities/user-profile'
import { MailingMessage } from './mailing-message.entity'

@Schema({
    collection: 'mailings',
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret: any, options) => {
            delete ret.__v
            ret.id = ret._id.toString()
            delete ret._id
        },
    },
})
export class MailingSchema {
    @Virtual({
        get: function () {
            const obj = this as any
            return obj._id.toString()
        },
    })
    id: string

    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    createdAt: Date
    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    updatedAt: Date

    @Prop({ type: mongoose.Schema.Types.Mixed })
    creationMetadata: MailingCreatorMetadata & MailingOriginalTargetUsersMetadata

    @Prop({ required: true })
    state: 'pending' | 'inProgress' | 'paused' | 'deleting' | 'resultInfoUpdating' | 'completed'

    @Prop({ required: true })
    issued: boolean

    @Prop({ required: true })
    targetUserTelegramIds: number[]

    @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
    mailingMessage: MailingMessage.BaseType

    @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
    mailingStatusMessage: {
        chatId: number
        messageId: number
    } | null

    @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
    mailingProgress: null | MailingProgress
}
export const mailingSchema = SchemaFactory.createForClass(MailingSchema)
export type MailingDocument = MailingSchema

export type MailingCreatorMetadata =
    | {
          createdBy: 'api'
      }
    | {
          createdBy: 'admin'
          adminTelegramUserInfo: UserProfile.TelegramInfo
          usersSelectionCriteria: 'all'
      }
export type MailingOriginalTargetUsersMetadata = {
    originalTargetUsers: {
        telegramIds: number[]
    }
}
export type MailingProgressStatisticCategory = keyof MailingProgress['statisticSending']
export type MailingProgress = {
    statisticSending: {
        success: number
        blockedUsers: number
        deactivatedUsers: number
        sendMessageError: number
        unknownErrors: number
    }
    statisticRemoving: {
        success: number
        removeMessageError: number
    } | null
    records: MailingProgressRecord[]
}
export type MailingProgressRecord = { chatId: number } & (
    | { status: 'sended' | 'deleted'; messageIds: number[] }
    | { status: 'failed'; error: string | null }
    | { status: 'skipped'; reason: string }
)

export type MailingCreateDto = Pick<
    MailingSchema,
    'state' | 'targetUserTelegramIds' | 'creationMetadata' | 'mailingMessage'
>

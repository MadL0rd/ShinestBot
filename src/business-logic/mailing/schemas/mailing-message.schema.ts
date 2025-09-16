import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { UserProfile } from 'src/entities/user-profile'
import { MailingMessage } from './mailing-message.entity'

@Schema({
    collection: 'mailing-messages',
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret, options) => {
            delete ret.__v
            ret.id = ret._id.toString()
            delete ret._id
        },
    },
})
export class MailingMessageSchema implements MailingMessage.BaseType {
    @Virtual({
        get: function () {
            const obj = this as any
            return obj._id.toString()
        },
    })
    id: string

    @Prop({
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true,
        default: () => MailingMessage.generateShortId(),
    })
    shortId: string

    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    createdAt: Date
    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    updatedAt: Date
    @Prop({ type: mongoose.Schema.Types.Date, index: true })
    expireAt: Date

    @Virtual({
        get: function () {
            const obj = this as MailingMessageDocument
            return [
                obj.createdAt.formattedWithAppTimeZone(),
                obj.author.username,
                obj.author.first_name,
                obj.author.last_name,
                obj.content.type,
                obj.content.type === 'custom' ? `"${obj.content.text?.slice(0, 16)}..."` : null,
            ].compact.join(' ')
        },
    })
    title: string

    @Prop({ type: mongoose.Schema.Types.Mixed })
    author: UserProfile.TelegramInfo

    @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
    content: MailingMessage.MailingContent

    @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: 0 })
    delaySecPerSending: number | null
}
export const mailingMessageSchema = SchemaFactory.createForClass(MailingMessageSchema)
export type MailingMessageDocument = MailingMessageSchema
export type MailingMessageAny = MailingMessage.BaseType & Partial<MailingMessageDocument>

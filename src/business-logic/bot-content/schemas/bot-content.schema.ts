import mongoose, { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { _BotContentEntity as BotContentEntity } from 'src/entities/bot-content/bot-content.entity'
import { UniqueMessage } from 'src/entities/bot-content/nested/unique-message.entity'
import { Survey } from 'src/entities/survey'

export type BotContentDocument = HydratedDocument<BotContent>

@Schema()
export class BotContent implements BotContentEntity.BaseType {
    @Prop()
    language: string

    @Prop()
    uniqueMessage: UniqueMessage

    @Prop()
    onboarding: BotContentEntity.OnboardingPage.BaseType[]

    @Prop({ type: mongoose.Schema.Types.Mixed })
    survey: Survey.BaseType
}

export type BotContentStable = Required<BotContent>

export const BotContentSchema = SchemaFactory.createForClass(BotContent)

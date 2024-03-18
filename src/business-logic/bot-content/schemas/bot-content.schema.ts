import mongoose, { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UniqueMessage } from './models/bot-content.unique-message'
import { OnboardingPage } from './models/bot-content.onboarding-page'
import { Survey } from './models/bot-content.survey'

export type BotContentDocument = HydratedDocument<BotContent>

@Schema()
export class BotContent {
    @Prop()
    language: string

    @Prop()
    uniqueMessage: UniqueMessage

    @Prop()
    onboarding: OnboardingPage[]

    @Prop({ type: mongoose.Schema.Types.Mixed })
    survey: Survey.Model
}

export type BotContentStable = Required<BotContent>

export const BotContentSchema = SchemaFactory.createForClass(BotContent)

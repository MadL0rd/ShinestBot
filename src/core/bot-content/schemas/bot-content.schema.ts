import { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UniqueMessage } from './models/bot-content.unique-message'
import { OnboardingPage } from './models/bot-content.onboarding-page'

export type BotContentDocument = HydratedDocument<BotContent>

@Schema()
export class BotContent {
    @Prop()
    language: string

    @Prop()
    uniqueMessage?: UniqueMessage

    @Prop()
    onboarding?: OnboardingPage[]
}

export type BotContentStable = Required<BotContent>

export const BotContentSchema = SchemaFactory.createForClass(BotContent)

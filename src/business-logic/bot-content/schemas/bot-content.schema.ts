import mongoose from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { BotContent } from 'src/entities/bot-content'
import { Survey } from 'src/entities/survey'

@Schema({ collection: 'bot-content' })
export class BotContentSchema implements BotContent.BaseType {
    @Prop()
    language: string

    @Prop({ type: mongoose.Schema.Types.Mixed })
    uniqueMessage: BotContent.UniqueMessage

    @Prop()
    onboarding: BotContent.OnboardingPage.BaseType[]

    @Prop({ type: mongoose.Schema.Types.Mixed })
    survey: Survey.BaseType
}

export type BotContentDocument = MongoDocument<BotContent.BaseType>
export const botContentSchema = SchemaFactory.createForClass(BotContentSchema)

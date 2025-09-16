import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { internalConstants } from 'src/app/app.internal-constants'
import { BotContent } from 'src/entities/bot-content'
import { UniqueMessagePrimitive } from 'src/entities/bot-content/nested/unique-message.entity'
import { MongoDocument } from 'src/entities/common/mongo-document.type'
import { Survey } from 'src/entities/survey'

@Schema({ collection: 'bot-content' })
export class BotContentSchema implements BotContent.BaseTypePrimitive {
    @Prop({ type: mongoose.Schema.Types.String, index: true, unique: true })
    language: string

    @Prop({
        type: mongoose.Schema.Types.Mixed,
        default: () => structuredClone(new UniqueMessagePrimitive()),
    })
    uniqueMessage: BotContent.UniqueMessagePrimitive

    @Prop({
        type: mongoose.Schema.Types.Mixed,
        default: {
            contentLanguage: internalConstants.sheetContent.defaultLanguage,
            questions: [],
        } satisfies Survey.BaseType,
    })
    survey: Survey.BaseType

    @Prop({
        type: mongoose.Schema.Types.Mixed,
        default: {
            chapters: [],
            paragraphs: [],
        } satisfies BotContent.Training.BaseType,
    })
    training: BotContent.Training.BaseType

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    onboardingGroups: BotContent.Onboarding.PagesGroup[]

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    onboardingPages: BotContent.Onboarding.Page[]

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    mainMenuMarkup: BotContent.MainMenuButton.BaseType[]

    @Prop({ type: mongoose.Schema.Types.Array, default: [] })
    redirectLinks: BotContent.RedirectLinks.BaseType[]
}

export type BotContentDocument = MongoDocument<BotContent.BaseTypePrimitive>
export const botContentSchema = SchemaFactory.createForClass(BotContentSchema)

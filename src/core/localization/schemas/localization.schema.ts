import mongoose from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { LocalizedString } from './models/localization.localized-string'
import { MongoDocument } from 'src/entities/common/mongo-document.type'

export type LocalizedGroup = {
    name: string
    languages: string[]
    content: Record<string, LocalizedString>
}

@Schema({ collection: 'localized-groups' })
export class LocalizedGroupSchema implements LocalizedGroup {
    @Prop()
    name: string

    @Prop()
    languages: string[]

    @Prop({ type: mongoose.Schema.Types.Mixed })
    content: Record<string, LocalizedString>
}

export type LocalizedGroupDocument = MongoDocument<LocalizedGroupSchema>
export const localizedGroupSchema = SchemaFactory.createForClass(LocalizedGroupSchema)

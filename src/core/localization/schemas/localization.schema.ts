import { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { LocalizedString } from './models/localization.localized-string'

export type LocalizedGroupDocument = HydratedDocument<LocalizedGroup>

@Schema()
export class LocalizedGroup {
    @Prop()
    name: string

    @Prop()
    content: LocalizedString[]
}

export type LocalizedGroupStable = Required<LocalizedGroup>

export const LocalizedationSchema = SchemaFactory.createForClass(LocalizedGroup)

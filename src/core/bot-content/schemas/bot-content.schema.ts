import { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { LanguageSupportedKey } from '../language-supported-key.enum'

export type BotContentDocument = HydratedDocument<BotContent>

export class UniqueMessage {
    unknownState?: string
    permissionDenied?: string
    
    mainMenuText?: string
    adminMenuText?: string
    menuButtonReturnToMainMenu?: string
    adminMenuButtonLoadData?: string
    adminMenuButtonReloadData?: string
}

export class OnboardingPage {
    id: string
    messageText: string
    buttonText: string
}

@Schema()
export class BotContent {
    @Prop()
    lang: LanguageSupportedKey

    @Prop()
    uniqueMessage?: UniqueMessage

    @Prop()
    onboarding?: OnboardingPage[]
}

export type BotContentStable = Required<BotContent>

export const BotContentSchema = SchemaFactory.createForClass(BotContent)

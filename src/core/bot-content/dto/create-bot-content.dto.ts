import { LanguageSupportedKey } from '../language-supported-key.enum'
import { PartialType } from '@nestjs/mapped-types'
import { BotContent, OnboardingPage, UniqueMessage } from '../schemas/bot-content.schema'

export class CreateBotContentDto extends PartialType(BotContent) {}
import { PartialType } from '@nestjs/mapped-types'
import { CreateBotContentDto } from './create-bot-content.dto'

export class UpdateBotContentDto extends PartialType(CreateBotContentDto) {}

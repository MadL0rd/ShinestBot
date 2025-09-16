import { BotContentSchema } from '../schemas/bot-content.schema'

export type BotContentDto = Partial<BotContentSchema> & Pick<BotContentSchema, 'language'>

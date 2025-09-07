import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SheetDataProviderModule } from '../../core/sheet-data-provider/sheet-data-provider.module'
import { BotContentService } from './bot-content.service'
import { BotContentSchema, botContentSchema } from './schemas/bot-content.schema'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: BotContentSchema.name, schema: botContentSchema }]),
        SheetDataProviderModule,
    ],
    providers: [BotContentService],
    exports: [BotContentService],
})
export class BotContentModule {}

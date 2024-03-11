import { Module } from '@nestjs/common'
import { BotContentService } from './bot-content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { BotContent, BotContentSchema } from './schemas/bot-content.schema'
import { LocalizationModule } from '../localization/localization.module'
import { SheetDataProviderModule } from '../sheet-data-provider/sheet-data-provider.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: BotContent.name,
                schema: BotContentSchema,
            },
        ]),
        SheetDataProviderModule,
        LocalizationModule,
    ],
    providers: [BotContentService],
    exports: [BotContentService],
})
export class BotContentModule {}

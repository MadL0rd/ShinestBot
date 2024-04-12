import { Module } from '@nestjs/common'
import { BotContentService } from './bot-content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { LocalizationModule } from '../../core/localization/localization.module'
import { SheetDataProviderModule } from '../../core/sheet-data-provider/sheet-data-provider.module'
import { BotContentSchema, botContentSchema } from './schemas/bot-content.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: BotContentSchema.name,
                schema: botContentSchema,
            },
        ]),
        SheetDataProviderModule,
        LocalizationModule,
    ],
    providers: [BotContentService],
    exports: [BotContentService],
})
export class BotContentModule {}

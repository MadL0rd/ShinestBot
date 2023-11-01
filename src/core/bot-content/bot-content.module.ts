import { Module } from '@nestjs/common'
import { BotContentService } from './bot-content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { BotContent, BotContentSchema } from './schemas/bot-content.schema'
import { GoogleTablesModule } from '../google-tables/google-tables.module'
import { LocalizationModule } from '../localization/localization.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: BotContent.name,
                schema: BotContentSchema,
            },
        ]),
        GoogleTablesModule,
        LocalizationModule,
    ],
    providers: [BotContentService],
    exports: [BotContentService],
})
export class BotContentModule {}

import { Module } from '@nestjs/common'
import { BotContentService } from './bot-content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { BotContent, BotContentSchema } from './schemas/bot-content.schema'
import { GoogleTablesModule } from '../google-tables/google-tables.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: BotContent.name,
                schema: BotContentSchema,
            },
        ]),
        GoogleTablesModule,
    ],
    providers: [BotContentService],
    exports: [BotContentService],
})
export class BotContentModule {}

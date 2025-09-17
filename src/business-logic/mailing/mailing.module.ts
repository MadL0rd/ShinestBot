import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotContentModule } from '../bot-content/bot-content.module'
import { ChainTasksModule } from '../chain-tasks/chain-tasks.module'
import { TelegramBridgeModule } from '../telegram-bridge/telegram-bridge.module'
import { UserModule } from '../user/user.module'
import { MailingMessagesRepository } from './mailing-messages.repo'
import { MailingRepository } from './mailing.repo'
import { MailingService } from './mailing.service'
import { mailingMessageSchema, MailingMessageSchema } from './schemas/mailing-message.schema'
import { MailingSchema, mailingSchema } from './schemas/mailings.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: MailingMessageSchema.name,
                schema: mailingMessageSchema,
            },
            {
                name: MailingSchema.name,
                schema: mailingSchema,
            },
        ]),
        TelegrafModule,
        UserModule,
        BotContentModule,
        ChainTasksModule,
        TelegramBridgeModule,
    ],
    providers: [MailingService, MailingMessagesRepository, MailingRepository],
    exports: [MailingService, MailingMessagesRepository],
    controllers: [],
})
export class MailingModule {}

import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { TelegramBridgeModule } from 'src/business-logic/telegram-bridge/telegram-bridge.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { StartCommandHandlerService } from './start-command-handler/start-command-handler.service'
import { UserBuilderService } from './user-builder/user-builder.service'
import { UserSupportService } from './user-support/user-support.service'

@Module({
    imports: [UserModule, TelegrafModule, BotContentModule, ChainTasksModule, TelegramBridgeModule],
    providers: [UserBuilderService, StartCommandHandlerService, UserSupportService],
    exports: [UserBuilderService, StartCommandHandlerService, UserSupportService],
})
export class UserAdapterModule {}

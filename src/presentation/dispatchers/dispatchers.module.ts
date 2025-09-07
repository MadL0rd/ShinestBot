import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { MailingModule } from 'src/business-logic/mailing/mailing.module'
import { TelegramBridgeModule } from 'src/business-logic/telegram-bridge/telegram-bridge.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { ScenesModule } from '../scenes/scenes.module'
import { UserAdapterModule } from '../user-adapter/user-adapter.module'
import { ModerationForumDispatcherService } from './services/moderation-forum-dispatcher.service'
import { PrivateDialogDispatcherService } from './services/private-dialog-dispatcher.service'
import { StorageChatDispatcherService } from './services/storage-chat-dispatcher.service'

@Module({
    imports: [
        BotContentModule,
        UserModule,
        TelegrafModule,
        ScenesModule,
        UserAdapterModule,
        ChainTasksModule,
        MailingModule,
        TelegramBridgeModule,
    ],
    providers: [
        PrivateDialogDispatcherService,
        ModerationForumDispatcherService,
        StorageChatDispatcherService,
    ],
    exports: [
        PrivateDialogDispatcherService,
        ModerationForumDispatcherService,
        StorageChatDispatcherService,
    ],
})
export class DispatchersModule {}

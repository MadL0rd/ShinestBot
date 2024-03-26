import { Module } from '@nestjs/common'
import { PrivateDialogDispatcherService } from './private-dialog-dispatcher/private-dialog-dispatcher.service'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { LocalizationModule } from 'src/core/localization/localization.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { TelegrafModule } from 'nestjs-telegraf'
import { ScenesModule } from '../scenes/scenes.module'
import { ModerationChatDispatcherService } from './moderation-chat-dispatcher/moderation-chat-dispatcher.service'
import { PublicationStorageModule } from 'src/business-logic/publication-storage/publication-storage.module'

@Module({
    imports: [
        BotContentModule,
        LocalizationModule,
        UserModule,
        TelegrafModule,
        ScenesModule,
        PublicationStorageModule,
    ],
    providers: [PrivateDialogDispatcherService, ModerationChatDispatcherService],
    exports: [PrivateDialogDispatcherService, ModerationChatDispatcherService],
})
export class DispatchersModule {}

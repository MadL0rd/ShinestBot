import { Module } from '@nestjs/common'
import { PrivateDialogDispatcherService } from './private-dialog-dispatcher/private-dialog-dispatcher.service'
import { BotContentModule } from 'src/core/bot-content/bot-content.module'
import { LocalizationModule } from 'src/core/localization/localization.module'
import { UserModule } from 'src/core/user/user.module'
import { TelegrafModule } from 'nestjs-telegraf'

@Module({
    imports: [BotContentModule, LocalizationModule, UserModule, TelegrafModule],
    providers: [PrivateDialogDispatcherService],
    exports: [PrivateDialogDispatcherService],
})
export class DispatchersModule {}

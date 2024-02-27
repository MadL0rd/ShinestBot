import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { BotContentModule } from 'src/core/bot-content/bot-content.module'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from 'src/core/user/user.module'
import { GptApiModule } from 'src/core/gpt-api/gpt-api.module'

@Module({
    imports: [BotContentModule, TelegrafModule, UserModule, GptApiModule],
    providers: [NotificationsService],
})
export class NotificationsModule {}

import { Module } from '@nestjs/common'
import { BotContentModule } from '../bot-content/bot-content.module'
import { ChainTasksModule } from '../chain-tasks/chain-tasks.module'
import { UserModule } from '../user/user.module'
import { RedirectLinksController } from './redirect-links.controller'

@Module({
    imports: [BotContentModule, ChainTasksModule, UserModule],
    providers: [],
    exports: [],
    controllers: [RedirectLinksController],
})
export class RedirectLinksModule {}

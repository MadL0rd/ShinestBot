import { Module } from '@nestjs/common'
import { ChainTasksModule } from '../chain-tasks/chain-tasks.module'
import { UserModule } from '../user/user.module'
import { TelegramBridgeFactoryService } from './telegram-bridge-factory/telegram-bridge-factory.service'

@Module({
    imports: [UserModule, ChainTasksModule],
    providers: [TelegramBridgeFactoryService],
    exports: [TelegramBridgeFactoryService],
})
export class TelegramBridgeModule {}

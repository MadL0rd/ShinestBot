import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { TelegramBridgeModule } from 'src/business-logic/telegram-bridge/telegram-bridge.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { DispatchersModule } from '../dispatchers/dispatchers.module'
import { ScenesModule } from '../scenes/scenes.module'
import { UserAdapterModule } from '../user-adapter/user-adapter.module'
import { TaskExecutorTelegramService } from './services/task-executor-telegram.service'
import { TaskExecutorService } from './services/task-executor.service'

@Module({
    imports: [
        UserAdapterModule,
        ChainTasksModule,
        ScenesModule,
        TelegrafModule,
        UserModule,
        BotContentModule,
        TelegramBridgeModule,
        DispatchersModule,
    ],
    providers: [TaskExecutorService, TaskExecutorTelegramService],
    exports: [TaskExecutorService],
})
export class TaskExecutorModule {}

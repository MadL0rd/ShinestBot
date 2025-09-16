import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegrafModule } from 'nestjs-telegraf'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { RedirectLinksModule } from 'src/business-logic/redirect-links/redirect-links.module'
import { AppLoggerMiddleware } from 'src/exceptions-and-logging/app-logger-middleware'
import { TaskExecutorModule } from 'src/presentation/task-executor/task-executor.module'
import { UserAdapterModule } from 'src/presentation/user-adapter/user-adapter.module'
import { MediaGroupCombinerMiddleware } from 'src/utils/telegraf-middlewares/combine-media-group'
import { injectContextInstanceMetadata } from 'src/utils/telegraf-middlewares/inject-context-instance-metadata'
import { injectMessageTypes } from 'src/utils/telegraf-middlewares/inject-message-types'
import { BotContentModule } from '../business-logic/bot-content/bot-content.module'
import { UserModule } from '../business-logic/user/user.module'
import { SheetDataProviderModule } from '../core/sheet-data-provider/sheet-data-provider.module'
import { DispatchersModule } from '../presentation/dispatchers/dispatchers.module'
import { internalConstants } from './app.internal-constants'
import { AppUpdate } from './app.update'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRoot(
            `mongodb://${internalConstants.mongodb.user}:${internalConstants.mongodb.password}@${internalConstants.mongodb.address}/`,
            { dbName: internalConstants.mongodb.database ?? undefined }
        ),
        TelegrafModule.forRoot({
            botName: 'Bot',
            launchOptions: {
                allowedUpdates: ['message', 'callback_query', 'my_chat_member'],
                webhook:
                    internalConstants.webhookAndPorts.isWebhookActive === true
                        ? {
                              domain: internalConstants.webhookAndPorts.webhookDomain,
                              port: internalConstants.webhookAndPorts.exposePortWebhook,
                              path: '/main-bot',
                          }
                        : undefined,
            },
            token: internalConstants.botTokens.mainBot,
            middlewares: [
                injectMessageTypes,
                new MediaGroupCombinerMiddleware(),
                injectContextInstanceMetadata({
                    botIdentifier: 'main',
                }),
            ],
        }),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        UserModule,
        BotContentModule,
        DispatchersModule,
        SheetDataProviderModule,
        UserAdapterModule,
        ChainTasksModule,
        RedirectLinksModule,
        TaskExecutorModule,
    ],
    providers: [AppUpdate],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(AppLoggerMiddleware).forRoutes('*')
    }
}

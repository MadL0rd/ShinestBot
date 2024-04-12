import { Module } from '@nestjs/common'
import { AppUpdate } from './app.update'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from '../business-logic/user/user.module'
import { BotContentModule } from '../business-logic/bot-content/bot-content.module'
import { LocalizationModule } from '../core/localization/localization.module'
import { internalConstants } from './app.internal-constants'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationsModule } from '../presentation/notifications/notifications.module'
import { GptApiModule } from '../business-logic/gpt-api/gpt-api.module'
import { DispatchersModule } from '../presentation/dispatchers/dispatchers.module'
import { ScenesModule } from '../presentation/scenes/scenes.module'
import { SheetDataProviderModule } from '../core/sheet-data-provider/sheet-data-provider.module'
import { PublicationStorageModule } from 'src/business-logic/publication-storage/publication-storage.module'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mediaGroup = require('telegraf-media-group')

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRoot(
            `mongodb://${internalConstants.mongodbUser}:${internalConstants.mongodbPassword}@${internalConstants.mongodbAddress}/`,
            { dbName: internalConstants.mongodbDatabase ?? undefined }
        ),
        TelegrafModule.forRoot({
            launchOptions:
                internalConstants.isWebhookActive === true
                    ? {
                          webhook: {
                              domain: internalConstants.webhookDomain,
                              port: Number(internalConstants.appExposePortWebhook),
                          },
                      }
                    : {},
            token: internalConstants.botToken,
            middlewares: [mediaGroup()],
        }),
        ScheduleModule.forRoot(),
        UserModule,
        LocalizationModule,
        BotContentModule,
        NotificationsModule,
        GptApiModule,
        DispatchersModule,
        ScenesModule,
        SheetDataProviderModule,
        PublicationStorageModule,
    ],
    providers: [AppUpdate],
})
export class AppModule {}

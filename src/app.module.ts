import { Module } from '@nestjs/common'
import { AppUpdate } from './app.update'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from './core/user/user.module'
import { BotContentModule } from './core/bot-content/bot-content.module'
import { LocalizationModule } from './core/localization/localization.module'
import * as mediaGroup from 'telegraf-media-group'
import { internalConstants } from './app.internal-constants'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationModule } from './presentation/notification/notification.module'
import { GptApiModule } from './core/gpt-api/gpt-api.module'

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
        NotificationModule,
        GptApiModule,
    ],
    providers: [AppUpdate],
})
export class AppModule {}

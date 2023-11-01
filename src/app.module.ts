import { Module } from '@nestjs/common'
import { AppUpdate } from './app.update'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from './core/user/user.module'
import { BotContentModule } from './core/bot-content/bot-content.module'
import { LocalizationModule } from './core/localization/localization.module'
import * as mediaGroup from 'telegraf-media-group'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(
            `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_ADDRESS}/`
        ),
        TelegrafModule.forRoot({
            launchOptions:
                process.env.IS_WEBHOOK_ACTIVE === 'true'
                    ? {
                          webhook: {
                              domain: process.env.WEBHOOK_DOMAIN,
                              port: Number(process.env.APP_EXPOSE_PORT_WEBHOOK),
                          },
                      }
                    : {},
            token: process.env.BOT_TOKEN,
            middlewares: [mediaGroup()],
        }),
        UserModule,
        LocalizationModule,
        BotContentModule,
    ],
    providers: [AppUpdate],
})
export class AppModule {}

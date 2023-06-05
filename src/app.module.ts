import { Module } from '@nestjs/common'
import { AppUpdate } from './app.update'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from './core/user/user.module'
import { BotContentModule } from './core/bot-content/bot-content.module'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(
            `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_ADDRESS}/`
        ),
        TelegrafModule.forRoot({
            //middlewares: [sessions.middleware()],
            token: process.env.BOT_TOKEN, // Токен конкретного бота
        }),
        UserModule,
        BotContentModule,
    ],
    providers: [AppService, AppUpdate],
})
export class AppModule {}

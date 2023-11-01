import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from './schemas/user.schema'
import { UserService } from './user.service'
import { StatisticService } from './statistic.service'
import { BotContentModule } from '../bot-content/bot-content.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema,
            },
        ]),
        BotContentModule,
    ],
    providers: [UserService, StatisticService],
    exports: [UserService],
})
export class UserModule {}

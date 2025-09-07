import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BotContentModule } from '../bot-content/bot-content.module'
import { UserEventsLogSchema, userEventsLogSchema } from './schemas/user-events-log.schema'
import { UserProfileSchema, userProfileSchema } from './schemas/user.schema'
import { StatisticService } from './statistic.service'
import { UserEventsLogRepository } from './user-events-log.repo'
import { UserService } from './user.service'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: UserProfileSchema.name,
                schema: userProfileSchema,
            },
            {
                name: UserEventsLogSchema.name,
                schema: userEventsLogSchema,
            },
        ]),
        BotContentModule,
    ],
    providers: [UserService, StatisticService, UserEventsLogRepository],
    exports: [UserService, StatisticService],
    controllers: [],
})
export class UserModule {}

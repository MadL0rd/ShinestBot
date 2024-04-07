import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserService } from './user.service'
import { StatisticService } from './statistic.service'
import { UserProfileSchema, userProfileSchema } from './schemas/user.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: UserProfileSchema.name,
                schema: userProfileSchema,
            },
        ]),
    ],
    providers: [UserService, StatisticService],
    exports: [UserService, StatisticService],
})
export class UserModule {}

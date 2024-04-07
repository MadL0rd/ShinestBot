import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserService } from './user.service'
import { StatisticService } from './statistic.service'
import { UserSchema, userSchema } from './schemas/user.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: UserSchema.name,
                schema: userSchema,
            },
        ]),
    ],
    providers: [UserService, StatisticService],
    exports: [UserService, StatisticService],
})
export class UserModule {}

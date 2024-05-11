import { Module } from '@nestjs/common'
import { UserBuilderService } from './user-builder.service'
import { UserModule } from 'src/business-logic/user/user.module'
import { TelegrafModule } from 'nestjs-telegraf'

@Module({
    imports: [UserModule, TelegrafModule],
    providers: [UserBuilderService],
    exports: [UserBuilderService],
})
export class UserAdapterModule {}

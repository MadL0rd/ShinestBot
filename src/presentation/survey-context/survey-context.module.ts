import { Module } from '@nestjs/common'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { UserAdapterModule } from '../user-adapter/user-adapter.module'
import { SurveyContextRegistrationService } from './context-providers/survey-context-provider-registration.service'
import { SurveyContextProviderFactoryService } from './survey-context-provider-factory/survey-context-provider-factory.service'

@Module({
    imports: [UserModule, BotContentModule, UserAdapterModule, ChainTasksModule],
    providers: [SurveyContextProviderFactoryService, SurveyContextRegistrationService],
    exports: [SurveyContextProviderFactoryService],
})
export class SurveyContextProviderModule {}

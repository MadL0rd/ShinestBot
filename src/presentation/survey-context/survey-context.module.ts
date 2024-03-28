import { Module } from '@nestjs/common'
import { SurveyContextDefaultService } from './context-providers/survey-context-provider-default.service'
import { SurveyContextProviderFactoryService } from './survey-context-provider-factory/survey-context-provider-factory.service'
import { UserModule } from 'src/business-logic/user/user.module'

@Module({
    imports: [UserModule],
    exports: [SurveyContextProviderFactoryService],
    providers: [SurveyContextProviderFactoryService, SurveyContextDefaultService],
})
export class SurveyContextProviderModule {}

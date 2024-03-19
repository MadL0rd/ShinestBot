import { Module } from '@nestjs/common'
import { SurveyProviderDefaultService } from './providers/survey-provider-default.service'
import { SurveyDataProviderFactoryService } from './survey-provider-factory/survey-provider-factory.service'
import { UserModule } from 'src/business-logic/user/user.module'

@Module({
    imports: [UserModule],
    exports: [SurveyDataProviderFactoryService],
    providers: [SurveyDataProviderFactoryService, SurveyProviderDefaultService],
})
export class SurveyDataProviderModule {}

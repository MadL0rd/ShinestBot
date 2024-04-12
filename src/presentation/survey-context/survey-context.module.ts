import { Module } from '@nestjs/common'
import { SurveyContextDefaultService } from './context-providers/survey-context-provider-default.service'
import { SurveyContextProviderFactoryService } from './survey-context-provider-factory/survey-context-provider-factory.service'
import { UserModule } from 'src/business-logic/user/user.module'
import { PublicationManagementModule } from '../publication-management/publication-management.module'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { SurveyContextModerationEditingService } from './context-providers/survey-context-provider-moderation-editing'
import { PublicationStorageModule } from 'src/business-logic/publication-storage/publication-storage.module'

@Module({
    imports: [UserModule, PublicationManagementModule, BotContentModule, PublicationStorageModule],
    exports: [SurveyContextProviderFactoryService],
    providers: [
        SurveyContextProviderFactoryService,
        SurveyContextDefaultService,
        SurveyContextModerationEditingService,
    ],
})
export class SurveyContextProviderModule {}

import { Module } from '@nestjs/common'
import { SceneFactoryService } from './scene-factory/scene-factory.service'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { SceneInjectionsProviderService } from './scene-factory/scene-injections-provider.service'
import { SurveyDataProviderModule } from '../survey-data-provider/survey-data-provider.module'
import { PublicationStorageModule } from 'src/business-logic/publication-storage/publication-storage.module'

@Module({
    imports: [BotContentModule, UserModule, SurveyDataProviderModule, PublicationStorageModule],
    providers: [SceneFactoryService, SceneInjectionsProviderService],
    exports: [SceneFactoryService],
})
export class ScenesModule {}

import { Module } from '@nestjs/common'
import { SceneFactoryService } from './scene-factory/scene-factory.service'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { LocalizationModule } from 'src/core/localization/localization.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { SceneInjectionsProviderService } from './scene-factory/scene-injections-provider.service'

@Module({
    imports: [BotContentModule, LocalizationModule, UserModule],
    providers: [SceneFactoryService, SceneInjectionsProviderService],
    exports: [SceneFactoryService],
})
export class ScenesModule {}

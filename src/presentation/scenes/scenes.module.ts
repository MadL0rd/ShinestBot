import { Module } from '@nestjs/common'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { ChainTasksModule } from 'src/business-logic/chain-tasks/chain-tasks.module'
import { MailingModule } from 'src/business-logic/mailing/mailing.module'
import { UserModule } from 'src/business-logic/user/user.module'
import { YandexSpeechKitModule } from 'src/business-logic/yandex-speech-kit/yandex-speech-kit.module'
import { SurveyContextProviderModule } from '../survey-context/survey-context.module'
import { UserAdapterModule } from '../user-adapter/user-adapter.module'
import { SceneFactoryService } from './scene-factory/scene-factory.service'
import { SceneInjectionsProviderService } from './scene-factory/scene-injections-provider.service'

@Module({
    imports: [
        BotContentModule,
        UserModule,
        SurveyContextProviderModule,
        YandexSpeechKitModule,
        UserAdapterModule,
        MailingModule,
        ChainTasksModule,
    ],
    providers: [SceneFactoryService, SceneInjectionsProviderService],
    exports: [SceneFactoryService],
})
export class ScenesModule {}

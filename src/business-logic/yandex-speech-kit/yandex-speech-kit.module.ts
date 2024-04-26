import { Module } from '@nestjs/common'
import { YandexSpeechKitService } from './yandex-speech-kit.service'
import { TelegrafModule } from 'nestjs-telegraf'

@Module({
    imports: [TelegrafModule],
    providers: [YandexSpeechKitService],
    exports: [YandexSpeechKitService],
})
export class YandexSpeechKitModule {}

import { Module } from '@nestjs/common'
import { TelegrafModule } from 'nestjs-telegraf'
import { YandexSpeechKitService } from './yandex-speech-kit.service'

@Module({
    imports: [TelegrafModule],
    providers: [YandexSpeechKitService],
    exports: [YandexSpeechKitService],
})
export class YandexSpeechKitModule {}

import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { Telegraf } from 'telegraf'
import { speech2text } from 'yandex-speech-promise'

@Injectable()
export class YandexSpeechKitService {
    constructor(@InjectBot() private readonly bot: Telegraf) {}

    async recognizeTextFromAudio(fileId: string): Promise<string | undefined> {
        const { file_path: filePath } = await this.bot.telegram.getFile(fileId)
        const response = await fetch(
            `https://api.telegram.org/file/bot${internalConstants.botToken}/${filePath}`
        )
        const buffer = Buffer.from(await response.arrayBuffer())

        const result = await speech2text(buffer, {
            auth: `Api-Key ${internalConstants.yandexSpeechKitApiKey}`,
        })

        return result
    }
}

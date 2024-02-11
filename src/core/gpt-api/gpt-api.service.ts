import { Injectable } from '@nestjs/common'
import { OpenAI } from 'openai'
import { internalConstants } from 'src/app.internal-constants'
import { GptContextElement } from './entities/gpt-context-element'
import { ChatCompletionMessageParam } from 'openai/resources'
import { logger } from 'src/app.logger'

@Injectable()
export class GptApiService {
    private readonly openai = new OpenAI({
        apiKey: internalConstants.gptApiKey,
        baseURL: internalConstants.gptProxyUrl,
    })

    async gptAnswer(contextMessages: GptContextElement[]): Promise<string | null> {
        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            messages: contextMessages as ChatCompletionMessageParam[],
            model: internalConstants.gptModel,
            temperature: internalConstants.gptModelTemperature,
        }
        try {
            const completion = await this.openai.chat.completions.create(params)
            return completion.choices.last?.message.content ?? ''
        } catch (error) {
            logger.error('Open AI api request failed', error)
            return null
        }
    }
}

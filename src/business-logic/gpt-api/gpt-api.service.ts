import { Injectable } from '@nestjs/common'
import { internalConstants } from 'src/app/app.internal-constants'
import { GptContextElement } from './entities/gpt-context-element'
import { logger } from 'src/app/app.logger'
import axios from 'axios'

@Injectable()
export class GptApiService {
    async gptAnswer(
        contextMessages: GptContextElement[],
        temperature: number | undefined = 0.6
    ): Promise<string | undefined> {
        temperature = temperature ? temperature : 0.6
        try {
            const apiKey = internalConstants.gptApiKey
            const modelUri = internalConstants.gptModelUri
            const response = await axios.request<ExercisesModel>({
                url: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
                method: 'POST',
                data: {
                    modelUri: modelUri,
                    completionOptions: {
                        stream: false,
                        temperature: temperature,
                    },
                    messages: contextMessages,
                },
                headers: {
                    Authorization: `Api-Key ${apiKey}`,
                },
            })
            return response.data.result?.alternatives?.first?.message?.text?.replaceAll('*', '')
        } catch (error) {
            logger.error('Error sending completion request:', error)
            return undefined
        }
    }
}

export interface ExercisesModel {
    result?: Result
}

export interface Result {
    alternatives?: Alternative[]
    usage?: Usage
    modelVersion?: string
}

export interface Alternative {
    message?: Message
    status?: string
}

export interface Message {
    role?: string
    text?: string
}

export interface Usage {
    inputTextTokens?: string
    completionTokens?: string
    totalTokens?: string
}

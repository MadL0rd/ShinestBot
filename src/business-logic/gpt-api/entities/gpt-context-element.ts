type ChatCompletionRole = 'system' | 'assistant' | 'user'

export class GptContextElement {
    role: ChatCompletionRole
    text: string
}

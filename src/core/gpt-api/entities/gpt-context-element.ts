import { ChatCompletionRole } from 'openai/resources'

export class GptContextElement {
    role: ChatCompletionRole
    content: string
}

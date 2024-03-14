import { ChatCompletionRole } from 'node_modules/openai/resources'

export class GptContextElement {
    role: ChatCompletionRole
    content: string
}

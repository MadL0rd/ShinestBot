import z from 'zod'
import { DebugInformativeLogger } from '../exceptions-and-logging/debug-informative-logger'

export const logger = new DebugInformativeLogger()

{
    const schema = z
        .object({
            BOT_TOKEN: z.string(),
            ERRORS_CHAT_ID: z.coerce.number(),
            ERRORS_CHAT_THREAD_ID: z.coerce.number().optional(),
        })
        .transform((env) => ({
            token: env.BOT_TOKEN,
            chatId: env.ERRORS_CHAT_ID,
            messageThreadId: env.ERRORS_CHAT_THREAD_ID,
        }))
    const result = schema.safeParse(process.env)
    if (result.success) {
        logger.telegram = result.data
    }
}

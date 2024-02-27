import { Update } from 'node_modules/telegraf/typings/core/types/typegram'
import { logger } from 'src/app.logger'
import { Context } from 'telegraf'

export function RuntimeExeptionGuard(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>
) {
    const fn = descriptor.value
    if (!fn) return descriptor

    descriptor.value = async function DescriptorValue(...args: any[]) {
        try {
            console.debug(`Start ${fn.name}`)
            await fn.apply(this, args)
        } catch (error) {
            let message = `RuntimeExeptionGuard: ${fn.name}`
            for (const arg of args) {
                if (arg instanceof Context) {
                    const ctx = arg as Context<Update>
                    const from = JSON.stringify(ctx.from)
                    const messageJson = JSON.stringify(ctx.message)
                    message += `\nFrom: ${from}\nUsername: ${messageJson}`
                }
            }
            if (message) logger.error(message, error)
            else logger.error(error)

            // Uncomment to throw an error to upper context
            // const [, , next] = args
            // next(error)
        }
        console.debug(`Finish ${fn.name}`)
    }
    return descriptor
}

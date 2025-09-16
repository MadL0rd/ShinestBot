import { Context, MiddlewareFn } from 'telegraf'

export type ContextWithInstanceMetadata = {
    metadata: InstanceMetadata
}

type InstanceMetadata = {
    botIdentifier: 'main' | 'service'
}

export function injectContextInstanceMetadata(metadata: InstanceMetadata) {
    const middleware: MiddlewareFn<Context> = (ctx, next) => {
        Object.assign(ctx, { metadata: metadata })
        next()
    }
    return middleware
}

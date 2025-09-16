import { Context, MiddlewareFn } from 'telegraf'

export function filterUpdatesByType(allowedUpdates: Context['updateType'][]) {
    const middleware: MiddlewareFn<Context> = (ctx, next) => {
        if (allowedUpdates.includes(ctx.updateType)) next()
    }
    return middleware
}

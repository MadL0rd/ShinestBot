import { Result } from 'src/utils/result'
import { sleep } from 'src/utils/sleep'

declare global {
    interface Promise<T> {
        tryResult(): Promise<Result<T>>
    }

    interface PromiseConstructor {
        retry<T>(config: PromiseRetryConfig<T>): Promise<T>
    }
}

export class PromiseService {
    initExtensions() {
        Promise.retry = retry

        Object.defineProperty(Promise.prototype, 'tryResult', {
            value: async function <T>() {
                return (this as Promise<T>)
                    .then((result): Result<T> => ({ success: true, result }))
                    .catch((error): Result<never> => ({ success: false, error }))
            },
        })
    }
}

type PromiseRetryConfig<T> = {
    call: () => Promise<T>
    count: number
    timeoutSec?: number
    onError?: (error: unknown) => Promise<void>
}

async function retry<T>(config: PromiseRetryConfig<T>): Promise<T> {
    let error: any
    for (let i = 0; i < config.count; i++) {
        // logger.log(`RETRY INDEX: ${i}`)
        try {
            const result = await config.call()
            return result
        } catch (e) {
            error = e
        }
        if (config.onError) {
            await config.onError(error)
        }
        if (config.timeoutSec && i + 1 !== config.count) {
            // logger.log(`RETRY DELAY: ${config.timeoutSec}`)
            await sleep(config.timeoutSec)
        }
    }

    throw error
}

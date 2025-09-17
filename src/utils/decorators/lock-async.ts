import { Mutex } from 'async-mutex'
import { sleep } from '../sleep'

export class ConcurrencyError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ConcurrencyError'
    }
}

export function LockAsyncWithReject() {
    return function <T>(
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>
    ) {
        const originalMethod = descriptor.value
        if (!originalMethod) return descriptor

        const mutex = new Mutex()

        descriptor.value = async function (...args: any[]): Promise<T> {
            if (mutex.isLocked()) {
                return Promise.reject(new ConcurrencyError('Method is already executing'))
            }

            const release = await mutex.acquire()
            try {
                return await originalMethod.apply(this, args)
            } finally {
                release()
            }
        }
        return descriptor
    }
}

export function LockAsyncWithSkip(args?: {
    timeoutsSec?: {
        before?: number
        after?: number
    }
}) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>
    ) {
        const originalMethod = descriptor.value
        if (!originalMethod) return descriptor

        const { timeoutsSec: timeouts } = args ?? {}
        const mutex = new Mutex()

        descriptor.value = async function (...args: any[]) {
            if (mutex.isLocked()) return

            const release = await mutex.acquire()
            try {
                if (timeouts?.before) await sleep(timeouts.before)
                await originalMethod.apply(this, args)
            } finally {
                if (timeouts?.after) await sleep(timeouts.after)
                release()
            }
        }
        return descriptor
    }
}

const mutexRegistry: Map<
    string,
    {
        mutex: Mutex
        consumersCount: number
    }
> = new Map()

/**
 * Decorator that ensures the decorated asynchronous method executes exclusively,
 * preventing concurrent executions for the same mutex key.
 *
 * The mutex key is dynamically generated based on the method's arguments via the provided `generateMutexId` function.
 * This ensures that critical sections within the method are executed in a serialized manner,
 * thus avoiding potential race conditions when multiple updates are processed simultaneously.
 *
 * `! WARNING !`: Do not wrap methods that call each other with this decorator.
 * Such interdependent calls may lead to a deadlock situation, as one method may wait indefinitely
 * for a mutex that is already held by another method in the call chain.
 */
export function LockAsyncWithSharedMutex<OriginalArgs>(args: {
    generateMutexId: (args: OriginalArgs) => string
    concurrencyStrategy?:
        | { type: 'runExclusive' | 'rejectIfMutexLocked' }
        | { type: 'semaphoreLikeReject'; maxConsumersCount: number }
    enableDebugLogs?: boolean
}) {
    args.concurrencyStrategy = args.concurrencyStrategy ?? { type: 'runExclusive' }
    args.enableDebugLogs = args.enableDebugLogs ?? false

    if (
        args.concurrencyStrategy.type === 'semaphoreLikeReject' &&
        args.concurrencyStrategy.maxConsumersCount <= 1
    ) {
        console.warn(
            [
                `Concurrency strategy changed to 'rejectIfMutexLocked'.`,
                `Strategy 'semaphoreLikeReject' should have 'maxConsumersCount' more them one.`,
                `Current value: ${args.concurrencyStrategy.maxConsumersCount}`,
            ].join('\n')
        )
        args.concurrencyStrategy = { type: 'rejectIfMutexLocked' }
    }

    return function (
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(args: OriginalArgs) => Promise<void>>
    ) {
        const originalMethod = descriptor.value
        if (!originalMethod) return descriptor
        const { generateMutexId, concurrencyStrategy, enableDebugLogs } = args

        descriptor.value = async function (args: OriginalArgs) {
            const mutexId = generateMutexId(args)
            let mutexObject = mutexRegistry.get(mutexId)
            if (mutexObject) {
                mutexObject.consumersCount += 1
            } else {
                mutexObject = {
                    mutex: new Mutex(),
                    consumersCount: 1,
                }
                mutexRegistry.set(mutexId, mutexObject)
            }

            const mutex = mutexObject.mutex
            try {
                if (enableDebugLogs) {
                    console.debug(
                        `START Run mutex ${mutexId}, consumersCount: ${mutexObject.consumersCount}`
                    )
                }
                if (
                    mutex.isLocked() &&
                    concurrencyStrategy?.type === 'semaphoreLikeReject' &&
                    mutexObject.consumersCount === concurrencyStrategy.maxConsumersCount + 1
                ) {
                    const name = originalMethod.name || _propertyKey
                    return Promise.reject(
                        new ConcurrencyError(
                            `Function '${name}' concurrency execution error. Mutex with id '${mutexId}' reach max consumers count: ${concurrencyStrategy.maxConsumersCount}`
                        )
                    )
                }
                if (concurrencyStrategy?.type === 'rejectIfMutexLocked' && mutex.isLocked()) {
                    const name = originalMethod.name || _propertyKey
                    return Promise.reject(
                        new ConcurrencyError(
                            `Function '${name}' concurrency execution error. Mutex with id '${mutexId}' is locked`
                        )
                    )
                }
                return await mutex.runExclusive(() => originalMethod.apply(this, [args]))
            } finally {
                mutexObject.consumersCount -= 1
                if (enableDebugLogs) {
                    console.debug(
                        `FINISH Run mutex ${mutexId}, consumersCount: ${mutexObject.consumersCount}`
                    )
                }
                if (mutexObject.consumersCount === 0) {
                    mutexRegistry.delete(mutexId)
                }
            }
        }
        return descriptor
    }
}

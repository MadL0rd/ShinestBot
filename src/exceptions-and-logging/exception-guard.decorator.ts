import { logger } from 'src/app/app.logger'

export function ExceptionGuard<OriginalArgs extends any[]>(args?: {
    generateArgsLogMetadata?: (...args: OriginalArgs) => string
    checkErrorShouldBeLogged?: (error: unknown) => boolean
}) {
    const generateArgsMetadata = args?.generateArgsLogMetadata
    const checkErrorShouldBeLogged = args?.checkErrorShouldBeLogged

    return function (
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(...args: OriginalArgs) => Promise<void>>
    ) {
        const originalMethod = descriptor.value
        if (!originalMethod) return descriptor

        descriptor.value = async function (...args: OriginalArgs) {
            try {
                await originalMethod.apply(this, args)
            } catch (error) {
                if (checkErrorShouldBeLogged && !checkErrorShouldBeLogged(error)) return

                const className = Object.getPrototypeOf(this)?.constructor?.name
                const methodInfo = className
                    ? `${className}.${originalMethod.name}`
                    : originalMethod.name
                const message = generateArgsMetadata
                    ? `ExceptionGuard: ${methodInfo}\n${generateArgsMetadata(...args)}`
                    : `ExceptionGuard: ${methodInfo}`
                logger.error(message, error)
            }
        }
        return descriptor
    }
}

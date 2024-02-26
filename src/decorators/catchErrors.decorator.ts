export function catchAllErrorsWithLogsAsync<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
    return function (this: This, ...args: Args): Return {
        const result = target.call(this, ...args)
        return result
    }
}

export function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name)

    function replacementMethod(this: any, ...args: any[]) {
        console.log(`LOG: Entering method '${methodName}'.`)
        const result = originalMethod.call(this, ...args)
        console.log(`LOG: Exiting method '${methodName}'.`)
        return result
    }

    return replacementMethod
}

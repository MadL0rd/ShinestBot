export function objectToMongooseFilter(obj: object) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'bigint':
            case 'boolean':
            case 'symbol':
                result[key] = value
                break

            case 'undefined':
                result[key] = { $exists: false }
                break

            case 'object':
                if (
                    value === null ||
                    Object.prototype.toString.call(value) === '[object Date]' ||
                    value instanceof RegExp
                ) {
                    result[key] = value
                    break
                }
                Object.assign(result, objectPropsToStringsWithDotPath(key, value))
                break

            case 'function':
                break
        }
    }
    return result
}

function objectPropsToStringsWithDotPath(prefixPath: string, obj: object) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
        const resultKey = [prefixPath, key].join('.')
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'bigint':
            case 'boolean':
            case 'symbol':
                result[resultKey] = value
                break

            case 'undefined':
                result[resultKey] = { $exists: false }
                break

            case 'object':
                if (
                    value === null ||
                    Object.prototype.toString.call(value) === '[object Date]' ||
                    value instanceof RegExp
                ) {
                    result[resultKey] = value
                    break
                }

                Object.assign(result, objectPropsToStringsWithDotPath(resultKey, value))
                break

            case 'function':
                break
        }
    }
    return result
}

export function pickFields<T extends Record<string | number | symbol, unknown>, K extends keyof T>(
    obj: T,
    fields: readonly K[]
): Pick<T, K> {
    return fields.reduce((acc, key) => {
        if (key in obj) {
            Object.assign(acc, {
                [key]: obj[key],
            })
        }
        return acc
    }, {}) as Pick<T, K>
}

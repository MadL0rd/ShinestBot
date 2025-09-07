export function mapFieldNames<
    Original extends Record<string, any>,
    NamesMap extends Partial<Record<keyof Original, string>> & Record<string, string>,
>(original: Original, mappedFields: NamesMap) {
    return Object.entries(original).reduce((acc, [originalKey, value]) => {
        const resultKey = mappedFields[originalKey] ?? originalKey
        Object.assign(acc, { [resultKey]: value })
        return acc
    }, {}) as {
        [Key in keyof Original as Key extends keyof NamesMap ? NamesMap[Key] : Key]: Original[Key]
    }
}

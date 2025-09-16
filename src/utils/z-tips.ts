import z from 'zod'

export namespace zTips {
    export const enumMapped = <const KeysMap extends Record<string, string>>(keysMap: KeysMap) => {
        const originalKeys = Object.keys(keysMap) as (keyof KeysMap)[] & [string, ...string[]]
        return z.enum(originalKeys).transform((value) => keysMap[value as keyof KeysMap])
    }

    export const numberFromString = {
        int: {
            required: z
                .string()
                .trim()
                .regex(/^-?\d+$/)
                .pipe(z.coerce.number()),
            optional: z.union([
                z.literal('').transform(() => undefined),
                z.undefined(),
                z
                    .string()
                    .trim()
                    .regex(/^-?\d+$/)
                    .pipe(z.coerce.number()),
            ]),
        },
        float: z
            .string()
            .trim()
            .regex(/^\d+(?:\.\d+)?$/)
            .pipe(z.coerce.number()),
    } as const
}

import { caseCamel } from './case-converter'

type WordSeparators = '_' | '-' | ' '

type ToCamelCase<S extends string> = S extends `${infer Head}${WordSeparators}${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<ToCamelCase<Tail>>}`
    : Lowercase<S>

export type CamelizeKeys<T> = {
    [K in keyof T as K extends string ? ToCamelCase<K> : K]: T[K]
}

export type CamelizeKeysDeep<T> = T extends readonly (infer U)[]
    ? CamelizeKeysDeep<U>[]
    : T extends Record<string, unknown>
      ? {
            [K in keyof T as K extends string ? ToCamelCase<K> : K]: CamelizeKeysDeep<T[K]>
        }
      : T

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp)
    )
}

export function camelizeKeys<T extends Record<string, unknown>>(input: T): CamelizeKeys<T> {
    if (isPlainObject(input)) {
        const result: Record<string, unknown> = {}
        for (const key in input) {
            const camelKey = caseCamel(key)
            result[camelKey] = (input as any)[key]
        }
        return result as CamelizeKeys<T>
    }

    return input as CamelizeKeys<T>
}

export function camelizeKeysDeep<T>(input: T): CamelizeKeysDeep<T> {
    if (Array.isArray(input)) {
        return input.map(camelizeKeysDeep) as CamelizeKeysDeep<T>
    }

    if (isPlainObject(input)) {
        const result: Record<string, unknown> = {}
        for (const key in input) {
            const camelKey = caseCamel(key)
            result[camelKey] = camelizeKeysDeep((input as any)[key])
        }
        return result as CamelizeKeysDeep<T>
    }

    return input as CamelizeKeysDeep<T>
}

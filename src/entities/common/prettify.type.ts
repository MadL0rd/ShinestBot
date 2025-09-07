/**
 * Utility type to prettify TS type annotations
 *
 * Use for types like this:
 * ```
 * type DirtyType = { a: string; b: number } & Omit<{ c: boolean } & Record<'d', string[]>, 'с'>
 * ```
 * *It just works*
 *
 * Source:
 * https://www.youtube.com/watch?v=lraHlXpuhKs
 */
export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

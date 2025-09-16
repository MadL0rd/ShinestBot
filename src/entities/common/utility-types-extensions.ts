import { Prettify } from './prettify.type'

export type OmitFields<T, K extends keyof T> = Omit<T, K>
export type OmitFromUnion<T, K extends keyof T> = T extends any ? Omit<T, K> : never
export type RequiredFields<T, K extends keyof T> = Prettify<T & RequiredAndNotNull<Pick<T, K>>>
export type PartialFields<T, K extends keyof T> = Prettify<
    Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>
>
export type ExcludeCases<T, K extends T> = Exclude<T, K>
export type ExtractCases<T, K extends T> = Extract<T, K>

export type RequiredAndNotNull<T> = {
    [P in keyof T]-?: Exclude<T[P], null | undefined>
}

export type ExtractFuncKeys<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

export namespace AggregationType {
    export type Union = keyof typeof names

    export const names = {
        totalEventsCount: 'Сумма',
        uniqueUserActions: 'Количество уникальных пользователей',
    } as const
    export const allCases = Object.keys(names) as Union[]

    export function includes(value: string | Union): value is Union {
        return allCases.includes(value)
    }
    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return includes(value) ? value : null
    }
}

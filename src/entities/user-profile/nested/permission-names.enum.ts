export namespace _UserProfilePermissionNames {
    export type Union = (typeof allCases)[number]
    export const allCases = ['owner', 'admin', 'banned'] as const

    export function includes(value: string | Union): value is Union {
        return allCases.includes(value)
    }
    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return includes(value) ? (value as Union) : null
    }
}

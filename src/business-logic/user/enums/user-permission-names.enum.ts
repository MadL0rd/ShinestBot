export namespace UserPermissionNames {
    export type union = (typeof allCases)[number]
    export const allCases = ['owner', 'admin', 'banned'] as const

    export function includes(value: string | union): boolean {
        return allCases.includes(value)
    }
    export function castToInstance(value?: string | union | null): union | null {
        if (!value) return null
        return includes(value) ? (value as union) : null
    }
}

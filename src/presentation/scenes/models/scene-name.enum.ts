export namespace SceneName {
    export type union = (typeof allCases)[number]
    export const allCases = [
        'mainMenu',
        'onboarding',
        'adminMenu',
        'adminMenuGenerateMetrix',
        'adminMenuUsersManagementScene',
        /** New scene name placeholder */
    ] as const

    export function includes(value: string | union): boolean {
        return allCases.includes(value)
    }

    export function castToInstance(value?: string | union | null): union | null {
        if (!value) return null
        return includes(value) ? (value as union) : null
    }

    export function getId(sceneName: SceneName.union): number {
        return allCases.indexOf(sceneName)
    }

    export function getById(id: number): SceneName.union | null {
        return allCases[id] ?? null
    }
}

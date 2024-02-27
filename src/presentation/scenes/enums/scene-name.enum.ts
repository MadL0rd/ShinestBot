export namespace SceneNames {
    export type union = (typeof allCases)[number]
    export const allCases = [
        'mainMenu',
        'onboarding',
        'adminMenu',
        'adminMenuGenerateMetrix',
        'adminMenuMailing',
        'adminMenuUsersManagement',
        'languageSettings',
        /** New scene name placeholder */
    ] as const

    export function includes(value: string | union): boolean {
        return allCases.includes(value)
    }

    export function castToInstance(value?: string | union | null): union | null {
        if (!value) return null
        return includes(value) ? (value as union) : null
    }

    export function getId(sceneName: SceneNames.union): number {
        return allCases.indexOf(sceneName)
    }

    export function getById(id: number): SceneNames.union | null {
        return allCases[id] ?? null
    }
}

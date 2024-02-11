/* eslint-disable @typescript-eslint/no-namespace */
export enum SceneName {
    mainMenu = 'mainMenu',
    onboarding = 'onboarding',
    adminMenu = 'adminMenu',
    adminMenuGenerateMetrix = 'adminMenuGenerateMetrix',
    adminMenuMailing = 'adminMenuMailing',
    adminMenuUsersManagement = 'adminMenuUsersManagement',
    languageSettings = 'languageSettings',
    payment = 'payment',
	/** New scene name placeholder */
}

export namespace SceneName {
    export function getId(sceneName: SceneName): number {
        let count = 0
        for (const name in SceneName) {
            if (sceneName == SceneName[name]) return count
            count++
        }

        return count
    }

    export function getById(id: number): SceneName | null {
        let count = 0
        for (const name in SceneName) {
            if (count == id) return SceneName[name]
            count++
        }

        return null
    }

    export function getBySceneName(name: string | any): SceneName | null {
        return SceneName[name] ?? null
    }
}

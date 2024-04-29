export namespace SceneName {
    export type Union = (typeof allCases)[number]
    export const allCases = [
        'mainMenu',
        'onboarding',
        'adminMenu',
        'adminMenuGenerateMetrics',
        'adminMenuUsersManagement',
        'adminMenuMailing',
        'languageSettings',
        'survey',
        'surveyContinue',
        'surveyFinal',
        'surveyQuestionOptions',
        'surveyQuestionStringNumeric',
        'surveyQuestionMedia',
        'userPublications',
        'moderationEditing',
        'surveyDescription',
        'surveyQuestionStringGptTips',
        'surveyQuestionStringGptTipsAnswerEditing',
        'surveyQuestionStringGptTipsUpdateWithGpt',
        /** New scene name placeholder */
    ] as const

    export function includes(value: string | Union): value is Union {
        return allCases.includes(value)
    }

    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return includes(value) ? (value as Union) : null
    }

    export function getId(sceneName: SceneName.Union): number {
        return allCases.indexOf(sceneName)
    }

    export function getById(id: number): SceneName.Union | null {
        return allCases[id] ?? null
    }
}

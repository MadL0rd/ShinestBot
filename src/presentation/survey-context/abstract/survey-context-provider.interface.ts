import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserProfile } from 'src/entities/user-profile'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'

export namespace SurveyContextProviderType {
    export const allCases = ['default', 'moderationEditing'] as const
    export type Union = (typeof allCases)[number]

    export function getId(sceneName: Union): number {
        return allCases.indexOf(sceneName) + 1
    }

    export function getById(id: number): Union | null {
        return allCases[id - 1] ?? null
    }
}

type ValidationResultSuccess = {
    canStartSurvey: true
}

type ValidationResultDenied = {
    canStartSurvey: false
    nextScene?: SceneEntrance.SomeSceneDto
    message?: string
}

export type ValidationResult = ValidationResultSuccess | ValidationResultDenied

export interface ISurveyContextProvider {
    type: SurveyContextProviderType.Union
    validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult>
    getSurvey(user: UserProfile.BaseType): Promise<Survey.Model>
    getAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache>
    getAnswersCacheStable(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache>
    setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void>
    clearAnswersCache(user: UserProfile.BaseType): Promise<void>
    pushAnswerToCache(user: UserProfile.BaseType, answer: Survey.PassedAnswer): Promise<void>
    popAnswerFromCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswer | undefined>
    completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined>
}

import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserProfile } from 'src/entities/user-profile/user-profile.entity'
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
    validateUserCanStartSurvey(user: UserProfile): Promise<ValidationResult>
    getSurvey(user: UserProfile): Promise<Survey.Model>
    getAnswersCache(user: UserProfile): Promise<Survey.PassedAnswersCache>
    getAnswersCacheStable(user: UserProfile): Promise<Survey.PassedAnswersCache>
    setAnswersCache(user: UserProfile, cache: Survey.PassedAnswersCache | undefined): Promise<void>
    clearAnswersCache(user: UserProfile): Promise<void>
    pushAnswerToCache(user: UserProfile, answer: Survey.PassedAnswer): Promise<void>
    popAnswerFromCache(user: UserProfile): Promise<Survey.PassedAnswer | undefined>
    completeSurveyAndGetNextScene(user: UserProfile): Promise<SceneEntrance.SomeSceneDto | undefined>
}

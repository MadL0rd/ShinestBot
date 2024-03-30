import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { User } from 'src/business-logic/user/schemas/user.schema'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'

export namespace SurveyContextProviderType {
    export const allCases = ['default'] as const
    export type Union = (typeof allCases)[number]

    export function getId(sceneName: Union): number {
        return allCases.indexOf(sceneName) + 1
    }

    export function getById(id: number): Union | null {
        return allCases[id - 1] ?? null
    }
}

export interface ISurveyContextProvider {
    type: SurveyContextProviderType.Union
    getSurvey(user: User): Promise<Survey.Model>
    getAnswersCache(user: User): Promise<Survey.PassedAnswersCache>
    getAnswersCacheStable(user: User): Promise<Survey.PassedAnswersCache>
    setAnswersCache(user: User, cache: Survey.PassedAnswersCache | undefined): Promise<void>
    clearAnswersCache(user: User): Promise<void>
    pushAnswerToCache(user: User, answer: Survey.PassedAnswer): Promise<void>
    popAnswerFromCache(user: User): Promise<void>
    completeSurveyAndGetNextScene(user: User): Promise<SceneEntrance.SomeSceneDto | undefined>
}

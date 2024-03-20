import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { User } from 'src/business-logic/user/schemas/user.schema'

export namespace SurveyDataProviderType {
    export const allCases = ['default'] as const
    export type Union = (typeof allCases)[number]

    export function getId(sceneName: Union): number {
        return allCases.indexOf(sceneName) + 1
    }

    export function getById(id: number): Union | null {
        return allCases[id - 1] ?? null
    }
}

export interface ISurveyDataProvider {
    type: SurveyDataProviderType.Union
    getSurvey(botContent: BotContent): Promise<Survey.Model>
    getAnswersCache(botContent: BotContent, user: User): Promise<Survey.PassedAnswersCache>
    getAnswersCacheStable(botContent: BotContent, user: User): Promise<Survey.PassedAnswersCache>
    setAnswersCache(user: User, cache: Survey.PassedAnswersCache | undefined): Promise<void>
    clearAnswersCache(user: User): Promise<void>
    pushAnswerToCache(user: User, answer: Survey.PassedAnswer): Promise<void>
    popAnswerFromCache(user: User): Promise<void>
}

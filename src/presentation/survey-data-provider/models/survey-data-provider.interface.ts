import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { User } from 'src/business-logic/user/schemas/user.schema'

export type SurveyDataProviderType = 'default'

export interface ISurveyDataProvider {
    type: SurveyDataProviderType
    getSurvey(botContent: BotContent): Promise<Survey.Model>
    getAnswersCache(botContent: BotContent, user: User): Promise<Survey.PassedAnswersCache>
    setAnswersCache(cache: Survey.PassedAnswersCache, user: User): Promise<void>
}
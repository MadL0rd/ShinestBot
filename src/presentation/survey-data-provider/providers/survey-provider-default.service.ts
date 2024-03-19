import { Injectable } from '@nestjs/common'
import { ISurveyDataProvider } from '../models/survey-data-provider.interface'
import { Survey } from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import { User } from 'src/business-logic/user/schemas/user.schema'

@Injectable()
export class SurveyProviderDefaultService implements ISurveyDataProvider {
    readonly type: 'default'

    constructor(private readonly userService: UserService) {}

    async getSurvey(botContent: BotContent): Promise<Survey.Model> {
        return botContent.survey
    }
    async getAnswersCache(botContent: BotContent, user: User): Promise<Survey.PassedAnswersCache> {
        const cache: Survey.PassedAnswersCache = user.internalInfo.surveyAnswersCache ?? {
            contentLanguage: botContent.language,
            passedAnswers: [],
        }
        if (cache.contentLanguage == botContent.language) return cache

        const survey = await this.getSurvey(botContent)
        return {
            contentLanguage: botContent.language,
            passedAnswers: cache.passedAnswers.compactMap((answer) => {
                const localizedQuesion = survey.questions.find(
                    (question) => question.id == answer.question.id
                )
                if (!localizedQuesion) return undefined
                answer.question = localizedQuesion
                return answer
            }),
        }
    }
    async setAnswersCache(cache: Survey.PassedAnswersCache, user: User): Promise<void> {
        user.internalInfo.surveyAnswersCache = cache
        this.userService.update(user)
    }
}

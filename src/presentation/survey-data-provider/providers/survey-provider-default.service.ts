import { Injectable } from '@nestjs/common'
import { ISurveyDataProvider } from '../models/survey-data-provider.interface'
import {
    Survey,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import { User } from 'src/business-logic/user/schemas/user.schema'
import { internalConstants } from 'src/app/app.internal-constants'

@Injectable()
export class SurveyProviderDefaultService implements ISurveyDataProvider {
    readonly type: 'default'

    constructor(private readonly userService: UserService) {}

    async getSurvey(botContent: BotContent): Promise<Survey.Model> {
        return botContent.survey
    }
    async getAnswersCache(botContent: BotContent, user: User): Promise<Survey.PassedAnswersCache> {
        const cache = this.getCacheWithoutLocalization(user)
        if (cache.contentLanguage == botContent.language) return cache

        const survey = await this.getSurvey(botContent)
        const cacheLocalized: Survey.PassedAnswersCache = {
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
        await this.setAnswersCache(user, cacheLocalized)

        return cacheLocalized
    }

    async getAnswersCacheStable(
        botContent: BotContent,
        user: User
    ): Promise<Survey.PassedAnswersCache> {
        const cache = await this.getAnswersCache(botContent, user)

        // Remove answers with unsupported options
        cache.passedAnswers = cache.passedAnswers.filter((answer) => {
            if (answer.type != 'options') return true
            if (answer.question.isRequired && !answer.selectedOptionId) return false
            if (
                answer.selectedOptionId &&
                !answer.question.options
                    .map((option) => option.id)
                    .includes(answer.selectedOptionId)
            ) {
                return false
            }
            return true
        })

        const filteredAnswers: Survey.PassedAnswer[] = []
        const answers = cache.passedAnswers
        const source = await this.getSurvey(botContent)

        // If survay is not completed
        if (SurveyUsageHelpers.findNextQuestion(source, answers)) cache

        // Sort questions in original order
        // and remove old question answers if survey was changed
        let targetQuestion = SurveyUsageHelpers.findNextQuestion(source, filteredAnswers)
        while (targetQuestion) {
            const targetQuestionId = targetQuestion.id
            const targetAnswer = answers.find((answer) => answer.question.id == targetQuestionId)
            if (!targetAnswer) {
                cache.passedAnswers = filteredAnswers
                return cache
            }
            targetAnswer.question = targetQuestion
            filteredAnswers.push(targetAnswer)

            targetQuestion = SurveyUsageHelpers.findNextQuestion(source, filteredAnswers)
        }

        cache.passedAnswers = filteredAnswers
        await this.setAnswersCache(user, cache)
        return cache
    }

    async setAnswersCache(user: User, cache: Survey.PassedAnswersCache | undefined): Promise<void> {
        user.internalInfo.surveyAnswersCache = cache
        await this.userService.update(user)
    }

    async clearAnswersCache(user: User): Promise<void> {
        await this.setAnswersCache(user, undefined)
    }

    async popAnswerFromCache(user: User): Promise<void> {
        const cache = this.getCacheWithoutLocalization(user)
        cache.passedAnswers.pop()
        await this.setAnswersCache(user, cache)
    }

    async pushAnswerToCache(user: User, answer: Survey.PassedAnswer): Promise<void> {
        const cache = this.getCacheWithoutLocalization(user)
        cache.passedAnswers.push(answer)
        await this.setAnswersCache(user, cache)
    }

    private getCacheWithoutLocalization(user: User): Survey.PassedAnswersCache {
        const cache: Survey.PassedAnswersCache = user.internalInfo.surveyAnswersCache ?? {
            contentLanguage: user.internalInfo.language ?? internalConstants.defaultLanguage,
            passedAnswers: [],
        }
        return cache
    }
}

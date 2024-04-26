import { Injectable } from '@nestjs/common'
import {
    ISurveyContextProviderPublicMethods,
    ValidationResult,
} from '../abstract/survey-context-provider.interface'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { UserProfile } from 'src/entities/user-profile'
import { Survey } from 'src/entities/survey'
import { BotContent } from 'src/entities/bot-content'

@Injectable()
export class SurveyContextServiceAbstract implements ISurveyContextProviderPublicMethods {
    constructor(
        protected readonly userService: UserService,
        protected readonly botContentService: BotContentService
    ) {}

    // =====================
    // Abstract methods
    // =====================

    async validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult> {
        return { canStartSurvey: true }
    }

    async getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType> {
        throw Error('Method not implemented.')
    }

    async getRawAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        throw Error('Method not implemented.')
    }

    async setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        throw Error('Method not implemented.')
    }

    async completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Public reusable methods
    // =====================

    async getAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const botContent = await this.getBotContentFor(user)
        const cache = await this.getRawAnswersCache(user)
        if (cache.contentLanguage == botContent.language) return cache

        const survey = await this.getSurvey(user)
        const cacheLocalized: Survey.PassedAnswersCache = {
            contentLanguage: botContent.language,
            passedAnswers: Survey.Helper.localizePassedAnswers(cache.passedAnswers, survey),
        }
        await this.setAnswersCache(user, cache)

        return cacheLocalized
    }

    async prepareConsistentAnswersCache(
        user: UserProfile.BaseType
    ): Promise<Survey.PassedAnswersCache> {
        const cache = await this.getAnswersCache(user)
        const filteredAnswers: Survey.PassedAnswer[] = []
        const answers = cache.passedAnswers.filter((answer) =>
            Survey.Helper.isAnswerSpecifiedCorrectly(answer)
        )
        const source = await this.getSurvey(user)

        // If survey is not completed
        if (Survey.Helper.findNextQuestion(source, answers)) cache

        // Sort questions in original order
        // and remove old question answers if survey was changed
        let targetQuestion = Survey.Helper.findNextQuestion(source, filteredAnswers)
        while (targetQuestion) {
            const targetQuestionId = targetQuestion.id
            const targetAnswer = answers.find((answer) => answer.question.id == targetQuestionId)
            if (!targetAnswer) {
                cache.passedAnswers = filteredAnswers
                return cache
            }
            targetAnswer.question = targetQuestion
            if (Survey.Helper.isAnswerSpecifiedCorrectly(targetAnswer).isFalse) break

            filteredAnswers.push(targetAnswer)

            targetQuestion = Survey.Helper.findNextQuestion(source, filteredAnswers)
        }

        cache.passedAnswers = filteredAnswers
        await this.setAnswersCache(user, cache)
        return cache
    }

    async setAnswersCacheWithLegacyQuestionsValidation(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        if (!cache) {
            await this.setAnswersCache(user, cache)
            return
        }

        const botContent = await this.getBotContentFor(user)
        const survey = await this.getSurvey(user)
        cache = {
            contentLanguage: botContent.language,
            passedAnswers: Survey.Helper.localizePassedAnswers(cache.passedAnswers, survey).filter(
                (answer) => Survey.Helper.isAnswerSpecifiedCorrectly(answer)
            ),
        }
        await this.setAnswersCache(user, cache)
    }

    async clearAnswersCache(user: UserProfile.BaseType): Promise<void> {
        await this.setAnswersCache(user, undefined)
    }

    async popAnswerFromCache(
        user: UserProfile.BaseType,
        beforeQuestionWithId?: string
    ): Promise<Survey.PassedAnswer | undefined> {
        const cache = await this.getAnswersCache(user)

        if (!beforeQuestionWithId) {
            const popedAnswer = cache.passedAnswers.pop()
            await this.setAnswersCache(user, cache)
            return popedAnswer
        }

        const survey = await this.getSurvey(user)
        const targetQuestionIndex = survey.questions.findIndex(
            (question) => question.id == beforeQuestionWithId
        )
        for (let i = targetQuestionIndex; i >= 0; i--) {
            const question = survey.questions[i]
            const answerPopIndex = cache.passedAnswers.findIndex(
                (answer) => answer.question.id == question.id
            )
            if (answerPopIndex >= 0) {
                const popedAnswer = cache.passedAnswers[answerPopIndex]
                cache.passedAnswers.splice(answerPopIndex, 1)
                await this.setAnswersCache(user, cache)
                return popedAnswer
            }
        }
        return undefined
    }

    async pushAnswerToCache(
        user: UserProfile.BaseType,
        answer: Survey.PassedAnswer
    ): Promise<void> {
        const cache = await this.getRawAnswersCache(user)
        cache.passedAnswers.push(answer)
        await this.setAnswersCache(user, cache)
    }

    // =====================
    // Protected methods
    // =====================

    protected async getBotContentFor(user: UserProfile.BaseType): Promise<BotContent.BaseType> {
        const userLanguage = UserProfile.Helper.getLanguageFor(user)
        return await this.botContentService.getContent(userLanguage)
    }
}

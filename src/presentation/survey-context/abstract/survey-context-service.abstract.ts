import { Injectable } from '@nestjs/common'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { Survey } from 'src/entities/survey'
import { UserProfile } from 'src/entities/user-profile'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import {
    ISurveyContextProvider,
    ValidationResult,
} from '../abstract/survey-context-provider.interface'

@Injectable()
export class SurveyContextServiceAbstract implements ISurveyContextProvider {
    readonly type: 'registration'

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

    async getNextQuestion(user: UserProfile.BaseType): Promise<Survey.Question | null> {
        const cache = await this.getAnswersCache(user)
        const surveySource = await this.getSurvey(user)
        const nextQuestion = Survey.Helper.findNextQuestion(surveySource, cache.passedAnswers)
        return nextQuestion
    }

    async getAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const botContent = await this.getBotContentFor(user)
        const cache = await this.getRawAnswersCache(user)
        if (cache.contentLanguage === botContent.language) return cache

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
        {
            const questionWithoutAnswer = Survey.Helper.findNextQuestion(source, answers)
            if (questionWithoutAnswer) {
                logger.error(
                    'Survey is not completed, consistent answer cache result may be incorrect.',
                    {
                        userTelegramId: user.telegramId,
                        providerType: this.type,
                        questionId: questionWithoutAnswer.id,
                    }
                )
            }
        }

        // Sort questions in original order
        // and remove old question answers if survey was changed
        let targetQuestion = Survey.Helper.findNextQuestion(source, filteredAnswers)
        while (targetQuestion) {
            const targetQuestionId = targetQuestion.id
            const targetAnswer = answers.find((answer) => answer.question.id === targetQuestionId)
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
        const filteredCache = this.deleteFilteredAnswersFromCache(cache)
        await this.setAnswersCache(user, filteredCache)
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
            const poppedAnswer = cache.passedAnswers.pop()
            await this.setAnswersCache(user, cache)
            return poppedAnswer
        }

        const survey = await this.getSurvey(user)
        const targetQuestionIndex = survey.questions.findIndex(
            (question) => question.id === beforeQuestionWithId
        )
        for (let i = targetQuestionIndex; i >= 0; i--) {
            const question = survey.questions[i]
            const answerPopIndex = cache.passedAnswers.findIndex(
                (answer) => answer.question.id === question.id
            )
            if (answerPopIndex >= 0) {
                const poppedAnswer = cache.passedAnswers[answerPopIndex]
                cache.passedAnswers.splice(answerPopIndex, 1)
                await this.setAnswersCache(user, cache)
                return poppedAnswer
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
        const filteredCache = this.deleteFilteredAnswersFromCache(cache)
        await this.setAnswersCache(user, filteredCache)

        this.userService.logToUserHistory(user, {
            type: 'surveyQuestionUserGaveAnAnswer',
            providerType: this.type,
            questionId: answer.question.id,
        })
    }

    // =====================
    // Protected methods
    // =====================
    protected deleteFilteredAnswersFromCache(
        cache: Survey.PassedAnswersCache
    ): Survey.PassedAnswersCache {
        const answers = cache.passedAnswers
        let usedRemoveIfFiltersTargetQuestionId: string[] = []
        cache.passedAnswers = answers
            .filter((targetAnswer) => {
                const deleteFilters = targetAnswer.question.filters.filter(
                    (filter) => filter.type === 'removeIf'
                )
                for (const filter of deleteFilters) {
                    if (
                        answers.some(
                            (answer) =>
                                (answer.type === 'optionsInline' || answer.type === 'options') &&
                                answer.question.id === filter.targetQuestionId &&
                                filter.validOptionIds.some(
                                    (option) => option === answer.selectedOptionId
                                )
                        )
                    ) {
                        usedRemoveIfFiltersTargetQuestionId =
                            usedRemoveIfFiltersTargetQuestionId.concat(filter.targetQuestionId)
                        return false
                    }
                }
                return true
            })
            .filter(
                (answer) =>
                    !usedRemoveIfFiltersTargetQuestionId.some(
                        (targetQuestionId) => answer.question.id === targetQuestionId
                    )
            )
        return cache
    }

    protected async getBotContentFor(user: UserProfile.BaseType): Promise<BotContent.BaseType> {
        const userLanguage = UserProfile.Helper.getLanguageFor(user)
        return await this.botContentService.getContent(userLanguage)
    }
}

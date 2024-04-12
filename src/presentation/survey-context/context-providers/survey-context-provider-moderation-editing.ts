import { Injectable } from '@nestjs/common'
import {
    ISurveyContextProvider,
    ValidationResult,
} from '../abstract/survey-context-provider.interface'
import { UserService } from 'src/business-logic/user/user.service'
import { internalConstants } from 'src/app/app.internal-constants'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { logger } from 'src/app/app.logger'
import { UserProfile } from 'src/entities/user-profile'
import { Survey } from 'src/entities/survey'
import { BotContentDocument } from 'src/business-logic/bot-content/schemas/bot-content.schema'

@Injectable()
export class SurveyContextModerationEditingService implements ISurveyContextProvider {
    readonly type: 'moderationEditing'

    constructor(
        private readonly userService: UserService,
        private readonly botContentService: BotContentService,
        private readonly publicationService: ModeratedPublicationsService,
        private readonly publicationStorageService: PublicationStorageService
    ) {}

    // =====================
    // Public methods
    // =====================

    async validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult> {
        const publicationDocumentId = user.internalInfo.adminsOnly.modifyingPublicationIdCurrent
        if (!publicationDocumentId) return { canStartSurvey: false }

        const publicationDocument = await this.publicationStorageService.findById(
            publicationDocumentId
        )
        if (!publicationDocument) return { canStartSurvey: false }

        return { canStartSurvey: true }
    }

    async getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType> {
        const botContent = await this.getBotContentFor(user)
        return botContent.survey
    }

    async getAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const botContent = await this.getBotContentFor(user)
        const cache = this.getCacheWithoutLocalization(user)
        if (cache.contentLanguage == botContent.language) return cache

        const survey = await this.getSurvey(user)
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

    async getAnswersCacheStable(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const cache = await this.getAnswersCache(user)

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
            filteredAnswers.push(targetAnswer)

            targetQuestion = Survey.Helper.findNextQuestion(source, filteredAnswers)
        }

        cache.passedAnswers = filteredAnswers
        await this.setAnswersCache(user, cache)
        return cache
    }

    async setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        user.internalInfo.publicationEditingCache = cache
        await this.userService.update(user)
    }

    async clearAnswersCache(user: UserProfile.BaseType): Promise<void> {
        await this.setAnswersCache(user, undefined)
    }

    async popAnswerFromCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswer | undefined> {
        const cache = this.getCacheWithoutLocalization(user)
        const popedAnswer = cache.passedAnswers.pop()
        await this.setAnswersCache(user, cache)
        return popedAnswer
    }

    async pushAnswerToCache(
        user: UserProfile.BaseType,
        answer: Survey.PassedAnswer
    ): Promise<void> {
        const cache = this.getCacheWithoutLocalization(user)
        cache.passedAnswers.push(answer)
        await this.setAnswersCache(user, cache)
    }

    async completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined> {
        const publicationDocumentId = user.internalInfo.adminsOnly?.modifyingPublicationIdCurrent
        if (!publicationDocumentId) {
            throw Error('Cannot find modifiedPublicationId in internalInfo.adminsOnly')
        }
        const modifiedPublication = await this.publicationStorageService.findById(
            publicationDocumentId
        )
        if (!modifiedPublication) {
            throw Error(`Cannot find publication by id ${publicationDocumentId}`)
        }
        const answersCache = await this.getAnswersCacheStable(user)
        this.publicationService.updatePublication(publicationDocumentId, {
            answers: answersCache.passedAnswers,
        })
        await this.clearAnswersCache(user)
        user.internalInfo.adminsOnly.modifyingPublicationIdPrepared = undefined
        user.internalInfo.adminsOnly.modifyingPublicationIdCurrent = undefined
        await this.userService.update(user)

        return undefined
    }

    // =====================
    // Private methods
    // =====================

    private async getBotContentFor(user: UserProfile.BaseType): Promise<BotContentDocument> {
        const userLanguage = UserProfile.Helper.getLanguageFor(user)
        return await this.botContentService.getContent(userLanguage)
    }

    private getCacheWithoutLocalization(user: UserProfile.BaseType): Survey.PassedAnswersCache {
        const cache: Survey.PassedAnswersCache = user.internalInfo.publicationEditingCache ?? {
            contentLanguage: user.internalInfo.language ?? internalConstants.defaultLanguage,
            passedAnswers: [],
        }
        return cache
    }
}

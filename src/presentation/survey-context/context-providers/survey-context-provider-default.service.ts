import { Injectable } from '@nestjs/common'
import {
    ISurveyContextProvider,
    ValidationResult,
} from '../abstract/survey-context-provider.interface'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'
import { UserProfile } from 'src/entities/user-profile'
import { Survey } from 'src/entities/survey'
import { SurveyContextServiceAbstract } from '../abstract/survey-context-service.abstract'
import { internalConstants } from 'src/app/app.internal-constants'

@Injectable()
export class SurveyContextDefaultService
    extends SurveyContextServiceAbstract
    implements ISurveyContextProvider
{
    readonly type: 'default'

    constructor(
        protected readonly userService: UserService,
        protected readonly botContentService: BotContentService,
        private readonly publicationService: ModeratedPublicationsService
    ) {
        super(userService, botContentService)
    }

    // =====================
    // Abstract methods implementation
    // =====================

    async validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult> {
        return { canStartSurvey: true }
    }

    async getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType> {
        const botContent = await this.getBotContentFor(user)
        return botContent.survey
    }

    async getRawAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const cache: Survey.PassedAnswersCache = user.internalInfo.surveyAnswersCache ?? {
            contentLanguage: user.internalInfo.language ?? internalConstants.defaultLanguage,
            passedAnswers: [],
        }
        return cache
    }

    async setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        user.internalInfo.surveyAnswersCache = cache
        await this.userService.update(user)
    }

    async completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined> {
        const answersCache = await this.prepareConsistentAnswersCache(user)
        const publication = await this.publicationService.createPublicationAndSendToModeration({
            userTelegramId: user.telegramId,
            creationDate: new Date(),
            language: answersCache.contentLanguage,
            answers: answersCache.passedAnswers,
            status: 'moderation',
            placementHistory: [],
        })

        user.internalInfo.publications.push(publication._id.toString())
        await this.userService.update(user)
        await this.clearAnswersCache(user)

        return undefined
    }
}

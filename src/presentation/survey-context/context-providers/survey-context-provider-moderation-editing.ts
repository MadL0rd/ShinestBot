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
import { UserProfile } from 'src/entities/user-profile'
import { Survey } from 'src/entities/survey'
import { SurveyContextServiceAbstract } from '../abstract/survey-context-service.abstract'

@Injectable()
export class SurveyContextModerationEditingService
    extends SurveyContextServiceAbstract
    implements ISurveyContextProvider
{
    readonly type: 'moderationEditing'

    constructor(
        protected readonly userService: UserService,
        protected readonly botContentService: BotContentService,
        private readonly publicationService: ModeratedPublicationsService,
        private readonly publicationStorageService: PublicationStorageService
    ) {
        super(userService, botContentService)
    }

    // =====================
    // Abstract methods implementation
    // =====================

    async validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult> {
        const publicationDocumentId = user.internalInfo.adminsOnly.modifyingPublicationIdCurrent
        if (!publicationDocumentId) return { canStartSurvey: false }

        const publicationDocument =
            await this.publicationStorageService.findById(publicationDocumentId)
        if (!publicationDocument) return { canStartSurvey: false }

        return { canStartSurvey: true }
    }

    async getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType> {
        const botContent = await this.getBotContentFor(user)
        return botContent.survey
    }

    async getRawAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache> {
        const cache: Survey.PassedAnswersCache = user.internalInfo.publicationEditingCache ?? {
            contentLanguage: user.internalInfo.language ?? internalConstants.defaultLanguage,
            passedAnswers: [],
        }
        return cache
    }

    async setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        user.internalInfo.publicationEditingCache = cache
        await this.userService.update(user)
    }

    async completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined> {
        const publicationDocumentId = user.internalInfo.adminsOnly?.modifyingPublicationIdCurrent
        if (!publicationDocumentId) {
            throw Error('Cannot find modifiedPublicationId in internalInfo.adminsOnly')
        }
        const modifiedPublication =
            await this.publicationStorageService.findById(publicationDocumentId)
        if (!modifiedPublication) {
            throw Error(`Cannot find publication by id ${publicationDocumentId}`)
        }
        const answersCache = await this.prepareConsistentAnswersCache(user)
        this.publicationService.updatePublication(publicationDocumentId, {
            answers: answersCache.passedAnswers,
        })
        await this.clearAnswersCache(user)
        user.internalInfo.adminsOnly.modifyingPublicationIdPrepared = undefined
        user.internalInfo.adminsOnly.modifyingPublicationIdCurrent = undefined
        await this.userService.update(user)

        return undefined
    }
}

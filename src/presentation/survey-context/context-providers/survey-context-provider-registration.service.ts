import { Injectable } from '@nestjs/common'
import { internalConstants } from 'src/app/app.internal-constants'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { Survey } from 'src/entities/survey'
import { UserProfile } from 'src/entities/user-profile'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import {
    ISurveyContextProvider,
    ValidationResult,
} from '../abstract/survey-context-provider.interface'
import { SurveyContextServiceAbstract } from '../abstract/survey-context-service.abstract'

@Injectable()
export class SurveyContextRegistrationService
    extends SurveyContextServiceAbstract
    implements ISurveyContextProvider
{
    override readonly type = 'registration'

    constructor(
        protected override readonly userService: UserService,
        protected override readonly botContentService: BotContentService
    ) {
        super(userService, botContentService)
    }

    // =====================
    // Abstract methods implementation
    // =====================

    override async validateUserCanStartSurvey(
        user: UserProfile.BaseType
    ): Promise<ValidationResult> {
        return {
            canStartSurvey: true,
        }
    }

    override async getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType> {
        const botContent = await this.getBotContentFor(user)
        return botContent.survey
    }

    override async getRawAnswersCache(
        user: UserProfile.BaseType
    ): Promise<Survey.PassedAnswersCache> {
        const cache: Survey.PassedAnswersCache = user.surveyAnswersCache ?? {
            contentLanguage: user.language ?? internalConstants.sheetContent.defaultLanguage,
            passedAnswers: [],
        }
        return cache
    }

    override async setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void> {
        user.surveyAnswersCache = cache ?? null
        await this.userService.update(user, ['surveyAnswersCache'])
    }

    override async completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined> {
        // const answersCache = await this.prepareConsistentAnswersCache(user)
        await this.clearAnswersCache(user)

        return undefined
    }
}

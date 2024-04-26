import { Injectable } from '@nestjs/common'
import { SceneName } from '../models/scene-name.enum'
import { MainMenuScene } from 'src/presentation/scenes/implementations/main-menu.scene'
import { IScene } from '../models/scene.interface'
import { SceneInjectionsProviderService } from './scene-injections-provider.service'
import { OnboardingScene } from 'src/presentation/scenes/implementations/onboarding.scene'
import { AdminMenuScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu.scene'
import { AdminMenuGenerateMetricsScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-generate-metrics.scene'
import { AdminMenuUsersManagementSceneScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-users-management-scene.scene'
import { AdminMenuMailingSceneScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-mailing-scene.scene'
import { LanguageSettingsSceneScene } from 'src/presentation/scenes/implementations/language-settings-scene.scene'
import { SurveyScene } from 'src/presentation/scenes/implementations/survey/survey.scene'
import { SurveyContinueScene } from 'src/presentation/scenes/implementations/survey/survey-continue.scene'
import { SurveyFinalScene } from 'src/presentation/scenes/implementations/survey/survey-final.scene'
import { SurveyQuestionOptionsScene } from 'src/presentation/scenes/implementations/survey/survey-question-options.scene'
import { SurveyQuestionStringNumericScene } from 'src/presentation/scenes/implementations/survey/survey-question-string-numeric.scene'
import { SurveyQuestionMediaScene } from 'src/presentation/scenes/implementations/survey/survey-question-media.scene'
import { UserPublicationsScene } from 'src/presentation/scenes/implementations/user-publications.scene'
import { ModerationEditingScene } from 'src/presentation/scenes/implementations/moderation-editing.scene'
import { SurveyQuestionStringGptTipsScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips.scene'
import { SurveyDescriptionScene } from '../implementations/survey-description.scene'
import { SurveyQuestionStringGptTipsAnswerEditingScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-answer-editing.scene'
import { SurveyQuestionStringGptTipsUpdateWithGptScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-update-with-gpt.scene'
/** New scene import placeholder */

@Injectable()
export class SceneFactoryService {
    constructor(private readonly injectionsProvider: SceneInjectionsProviderService) {}

    createSceneWith(name: SceneName.Union): IScene | null {
        switch (name) {
            case 'mainMenu':
                return this.injectionsProvider.resolve(MainMenuScene)
            case 'onboarding':
                return this.injectionsProvider.resolve(OnboardingScene)
            case 'adminMenu':
                return this.injectionsProvider.resolve(AdminMenuScene)
            case 'adminMenuGenerateMetrics':
                return this.injectionsProvider.resolve(AdminMenuGenerateMetricsScene)
            case 'adminMenuUsersManagement':
                return this.injectionsProvider.resolve(AdminMenuUsersManagementSceneScene)
            case 'adminMenuMailing':
                return this.injectionsProvider.resolve(AdminMenuMailingSceneScene)
            case 'languageSettings':
                return this.injectionsProvider.resolve(LanguageSettingsSceneScene)
            case 'survey':
                return this.injectionsProvider.resolve(SurveyScene)
            case 'surveyContinue':
                return this.injectionsProvider.resolve(SurveyContinueScene)
            case 'surveyFinal':
                return this.injectionsProvider.resolve(SurveyFinalScene)
            case 'surveyQuestionOptions':
                return this.injectionsProvider.resolve(SurveyQuestionOptionsScene)
            case 'surveyQuestionStringNumeric':
                return this.injectionsProvider.resolve(SurveyQuestionStringNumericScene)
            case 'surveyQuestionMedia':
                return this.injectionsProvider.resolve(SurveyQuestionMediaScene)
            case 'userPublications':
                return this.injectionsProvider.resolve(UserPublicationsScene)
            case 'moderationEditing':
                return this.injectionsProvider.resolve(ModerationEditingScene)
            case 'surveyDescription':
                return this.injectionsProvider.resolve(SurveyDescriptionScene)
            case 'surveyQuestionStringGptTips':
                return this.injectionsProvider.resolve(SurveyQuestionStringGptTipsScene)
            case 'surveyQuestionStringGptTipsAnswerEditing':
                return this.injectionsProvider.resolve(
                    SurveyQuestionStringGptTipsAnswerEditingScene
                )
            case 'surveyQuestionStringGptTipsUpdateWithGpt':
                return this.injectionsProvider.resolve(
                    SurveyQuestionStringGptTipsUpdateWithGptScene
                )
            /** New scene generation placeholder */
        }
        return null
    }
}

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
import { SurveyScene } from 'src/presentation/scenes/implementations/survey.scene'
import { SurveyContinueScene } from 'src/presentation/scenes/implementations/survey-continue.scene'
import { SurveyFinalScene } from 'src/presentation/scenes/implementations/survey-final.scene'
import { SurveyQuestionOptionsScene } from 'src/presentation/scenes/implementations/survey-question-options.scene'
import { SurveyQuestionStringNumericScene } from 'src/presentation/scenes/implementations/survey-question-string-numeric.scene'
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
            case 'adminMenuUsersManagementScene':
                return this.injectionsProvider.resolve(AdminMenuUsersManagementSceneScene)
            case 'adminMenuMailingScene':
                return this.injectionsProvider.resolve(AdminMenuMailingSceneScene)
            case 'languageSettingsScene':
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
            /** New scene generation placeholder */
        }
        return null
    }
}

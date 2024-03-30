import { SceneName } from './scene-name.enum'
import { MainMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/main-menu.scene'
import { OnboardingSceneEntranceDto } from 'src/presentation/scenes/implementations/onboarding.scene'
import { AdminMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu.scene'
import { AdminMenuGenerateMetricsSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-generate-metrics.scene'
import { AdminMenuUsersManagementSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-users-management-scene.scene'
import { AdminMenuMailingSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-mailing-scene.scene'
import { LanguageSettingsSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/language-settings-scene.scene'
import { SurveySceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey.scene'
import { SurveyContinueSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-continue.scene'
import { SurveyFinalSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-final.scene'
import { SurveyQuestionOptionsSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-options.scene'
import { SurveyQuestionStringNumericSceneEntranceDto } from '../implementations/survey/survey-question-string-numeric.scene'
import { SurveyQuestionMediaSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-media.scene'
import { UserPublicationsSceneEntranceDto } from 'src/presentation/scenes/implementations/user-publications.scene'
/** New scene entrance dto import placeholder */

export namespace SceneEntrance {
    // =====================
    // Common types
    // =====================
    export type Dto = {
        readonly sceneName: SceneName.Union
    }

    // =====================
    // Generated scene enter dto types
    // =====================

    export type AnySceneDto = Dto & SomeSceneDto

    export type SomeSceneDto =
        | MainMenuSceneEntranceDto
        | OnboardingSceneEntranceDto
        | AdminMenuSceneEntranceDto
        | AdminMenuGenerateMetricsSceneEntranceDto
        | AdminMenuUsersManagementSceneSceneEntranceDto
        | AdminMenuMailingSceneSceneEntranceDto
        | LanguageSettingsSceneSceneEntranceDto
        | SurveySceneEntranceDto
        | SurveyContinueSceneEntranceDto
        | SurveyFinalSceneEntranceDto
        | SurveyQuestionOptionsSceneEntranceDto
        | SurveyQuestionStringNumericSceneEntranceDto
        | SurveyQuestionMediaSceneEntranceDto
        | UserPublicationsSceneEntranceDto
    /** New scene entrance dto placeholder */
}

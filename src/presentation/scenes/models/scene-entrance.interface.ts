import { AdminMenuGenerateMetricsSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-generate-metrics.scene'
import { AdminMenuUserPermissionsEditorSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-user-permissions-editor.scene'
import { AdminMenuUsersManagementSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-users-management-scene.scene'
import { AdminMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/admin-menu.scene'
import { AdminMenuMailingCopyForwardSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-copy-forward.scene'
import { AdminMenuMailingCustomSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-custom.scene'
import { AdminMenuMailingPreformedSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-preformed.scene'
import { AdminMenuMailingPreviewSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-preview.scene'
import { AdminMenuMailingSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-scene.scene'
import { LanguageSettingsSceneEntranceDto } from 'src/presentation/scenes/implementations/language-settings-scene.scene'
import { MainMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/main-menu.scene'
import { OnboardingSceneEntranceDto } from 'src/presentation/scenes/implementations/onboarding.scene'
import { SurveyContinueSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-continue.scene'
import { SurveyFinalSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-final.scene'
import { SurveyQuestionMediaSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-media.scene'
import { SurveyQuestionMultipleChoiceSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-multiple-choice.scene'
import { SurveyQuestionOptionsInlineSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-options-inline.scene'
import { SurveyQuestionOptionsSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-options.scene'
import { SurveyQuestionSingleImageSceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey-question-single-image.scene'
import { SurveySceneEntranceDto } from 'src/presentation/scenes/implementations/survey/survey.scene'
import { TrainingSelectStepSceneEntranceDto } from 'src/presentation/scenes/implementations/training/training-select-step.scene'
import { TrainingStartSceneEntranceDto } from 'src/presentation/scenes/implementations/training/training-start.scene'
import { TrainingSceneEntranceDto } from 'src/presentation/scenes/implementations/training/training.scene'
import { SurveyDescriptionSceneEntranceDto } from '../implementations/survey-description.scene'
import { SurveyQuestionPhoneNumberSceneEntranceDto } from '../implementations/survey/survey-question-phone-number.scene'
import { SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-answer-editing.scene'
import { SurveyQuestionStringGptTipsUpdateWithGptSceneEntranceDto } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-update-with-gpt.scene'
import { SurveyQuestionStringGptTipsSceneEntranceDto } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips.scene'
import { SurveyQuestionStringNumericSceneEntranceDto } from '../implementations/survey/survey-question-string-numeric.scene'
import { SceneName } from './scene-name.enum'
/** New scene entrance dto import placeholder */

export namespace SceneEntrance {
    // =====================
    // Common types
    // =====================
    /**
     * Dto common props
     * @field sceneName
     */
    export type Dto = {
        readonly sceneName: SceneName.Union
    }

    // =====================
    // Generated scene enter dto types
    // =====================

    /**
     * Abstract scene dto
     */
    export type AnySceneDto = Dto & SomeSceneDto

    /**
     * Specific scene dto
     */
    export type SomeSceneDto =
        | MainMenuSceneEntranceDto
        | OnboardingSceneEntranceDto
        | AdminMenuSceneEntranceDto
        | AdminMenuGenerateMetricsSceneEntranceDto
        | AdminMenuUsersManagementSceneEntranceDto
        | AdminMenuMailingSceneEntranceDto
        | LanguageSettingsSceneEntranceDto
        | SurveySceneEntranceDto
        | SurveyContinueSceneEntranceDto
        | SurveyFinalSceneEntranceDto
        | SurveyQuestionOptionsSceneEntranceDto
        | SurveyQuestionStringNumericSceneEntranceDto
        | SurveyQuestionMediaSceneEntranceDto
        | SurveyDescriptionSceneEntranceDto
        | SurveyQuestionStringGptTipsSceneEntranceDto
        | SurveyQuestionStringGptTipsAnswerEditingSceneEntranceDto
        | SurveyQuestionStringGptTipsUpdateWithGptSceneEntranceDto
        | SurveyQuestionMultipleChoiceSceneEntranceDto
        | TrainingSceneEntranceDto
        | TrainingStartSceneEntranceDto
        | TrainingSelectStepSceneEntranceDto
        | SurveyQuestionPhoneNumberSceneEntranceDto
        | AdminMenuMailingCustomSceneEntranceDto
        | AdminMenuMailingCopyForwardSceneEntranceDto
        | AdminMenuMailingPreformedSceneEntranceDto
        | AdminMenuMailingPreviewSceneEntranceDto
        | SurveyQuestionOptionsInlineSceneEntranceDto
        | SurveyQuestionSingleImageSceneEntranceDto
        | AdminMenuUserPermissionsEditorSceneEntranceDto
    /** New scene entrance dto placeholder */
}

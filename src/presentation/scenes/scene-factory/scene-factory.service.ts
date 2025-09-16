import { Injectable } from '@nestjs/common'
import { AdminMenuGenerateMetricsScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-generate-metrics.scene'
import { AdminMenuUserPermissionsEditorScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-user-permissions-editor.scene'
import { AdminMenuUsersManagementScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu-users-management-scene.scene'
import { AdminMenuScene } from 'src/presentation/scenes/implementations/admin-menu/admin-menu.scene'
import { AdminMenuMailingCopyForwardScene } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-copy-forward.scene'
import { AdminMenuMailingCustomScene } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-custom.scene'
import { AdminMenuMailingPreformedScene } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-preformed.scene'
import { AdminMenuMailingPreviewScene } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-preview.scene'
import { AdminMenuMailingScene } from 'src/presentation/scenes/implementations/admin-menu/mailing/admin-menu-mailing-scene.scene'
import { LanguageSettingsScene } from 'src/presentation/scenes/implementations/language-settings-scene.scene'
import { MainMenuScene } from 'src/presentation/scenes/implementations/main-menu.scene'
import { OnboardingScene } from 'src/presentation/scenes/implementations/onboarding.scene'
import { SurveyContinueScene } from 'src/presentation/scenes/implementations/survey/survey-continue.scene'
import { SurveyFinalScene } from 'src/presentation/scenes/implementations/survey/survey-final.scene'
import { SurveyQuestionMediaScene } from 'src/presentation/scenes/implementations/survey/survey-question-media.scene'
import { SurveyQuestionMultipleChoiceScene } from 'src/presentation/scenes/implementations/survey/survey-question-multiple-choice.scene'
import { SurveyQuestionOptionsInlineScene } from 'src/presentation/scenes/implementations/survey/survey-question-options-inline.scene'
import { SurveyQuestionOptionsScene } from 'src/presentation/scenes/implementations/survey/survey-question-options.scene'
import { SurveyQuestionSingleImageScene } from 'src/presentation/scenes/implementations/survey/survey-question-single-image.scene'
import { SurveyQuestionStringNumericScene } from 'src/presentation/scenes/implementations/survey/survey-question-string-numeric.scene'
import { SurveyScene } from 'src/presentation/scenes/implementations/survey/survey.scene'
import { TrainingSelectStepScene } from 'src/presentation/scenes/implementations/training/training-select-step.scene'
import { TrainingStartScene } from 'src/presentation/scenes/implementations/training/training-start.scene'
import { TrainingScene } from 'src/presentation/scenes/implementations/training/training.scene'
import { SurveyDescriptionScene } from '../implementations/survey-description.scene'
import { SurveyQuestionPhoneNumberScene } from '../implementations/survey/survey-question-phone-number.scene'
import { SurveyQuestionStringGptTipsAnswerEditingScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-answer-editing.scene'
import { SurveyQuestionStringGptTipsUpdateWithGptScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips-update-with-gpt.scene'
import { SurveyQuestionStringGptTipsScene } from '../implementations/survey/survey-question-string-gpt-tips/survey-question-string-gpt-tips.scene'
import { SceneName } from '../models/scene-name.enum'
import { IScene } from '../models/scene.interface'
import { SceneInjectionsProviderService } from './scene-injections-provider.service'
/** New scene import placeholder */

@Injectable()
export class SceneFactoryService {
    private readonly sceneClasses = {
        mainMenu: MainMenuScene,
        onboarding: OnboardingScene,
        adminMenu: AdminMenuScene,
        adminMenuGenerateMetrics: AdminMenuGenerateMetricsScene,
        adminMenuUsersManagement: AdminMenuUsersManagementScene,
        adminMenuMailing: AdminMenuMailingScene,
        languageSettings: LanguageSettingsScene,
        survey: SurveyScene,
        surveyContinue: SurveyContinueScene,
        surveyFinal: SurveyFinalScene,
        surveyQuestionOptions: SurveyQuestionOptionsScene,
        surveyQuestionStringNumeric: SurveyQuestionStringNumericScene,
        surveyQuestionMedia: SurveyQuestionMediaScene,
        surveyDescription: SurveyDescriptionScene,
        surveyQuestionStringGptTips: SurveyQuestionStringGptTipsScene,
        surveyQuestionStringGptTipsAnswerEditing: SurveyQuestionStringGptTipsAnswerEditingScene,
        surveyQuestionStringGptTipsUpdateWithGpt: SurveyQuestionStringGptTipsUpdateWithGptScene,
        surveyQuestionMultipleChoice: SurveyQuestionMultipleChoiceScene,
        training: TrainingScene,
        trainingStart: TrainingStartScene,
        trainingSelectStep: TrainingSelectStepScene,
        surveyQuestionPhoneNumber: SurveyQuestionPhoneNumberScene,
        adminMenuMailingCustom: AdminMenuMailingCustomScene,
        adminMenuMailingCopyForward: AdminMenuMailingCopyForwardScene,
        adminMenuMailingPreformed: AdminMenuMailingPreformedScene,
        adminMenuMailingPreview: AdminMenuMailingPreviewScene,
        surveyQuestionOptionsInline: SurveyQuestionOptionsInlineScene,
        surveyQuestionSingleImage: SurveyQuestionSingleImageScene,
        adminMenuUserPermissionsEditor: AdminMenuUserPermissionsEditorScene,
        /** New scene generation placeholder */
    }

    constructor(private readonly injectionsProvider: SceneInjectionsProviderService) {}

    createSceneByName(name: SceneName.Union): IScene {
        const sceneClass: IScene = this.sceneClasses[name] as any
        if (!sceneClass) throw Error(`Unsupported scene name: ${name}`)
        return this.injectionsProvider.resolve(sceneClass as any)
    }
}

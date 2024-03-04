import { SceneName } from './scene-name.enum'
import { MainMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/main-menu.scene'
import { OnboardingSceneEntranceDto } from 'src/presentation/scenes/implementations/onboarding.scene'
import { AdminMenuSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu.scene'
import { AdminMenuGenerateMetrixSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu-generate-metrix.scene'
import { AdminMenuUsersManagementSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu-users-management-scene.scene'
import { AdminMenuMailingSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/admin-menu-mailing-scene.scene'
import { LanguageSettingsSceneSceneEntranceDto } from 'src/presentation/scenes/implementations/language-settings-scene.scene'
/** New scene entrance dto import placeholder */

export namespace SceneEntrance {
    // =====================
    // Commom types
    // =====================
    export interface Dto {
        readonly sceneName: SceneName.union
    }

    // =====================
    // Generated scene enter dto types
    // =====================

    export type AnySceneDto = Dto & SomeSceneDto

    export type SomeSceneDto =
        | MainMenuSceneEntranceDto
        | OnboardingSceneEntranceDto
        | AdminMenuSceneEntranceDto
        | AdminMenuGenerateMetrixSceneEntranceDto
        | AdminMenuUsersManagementSceneSceneEntranceDto
        | AdminMenuMailingSceneSceneEntranceDto
        | LanguageSettingsSceneSceneEntranceDto
    /** New scene entrance dto placeholder */
}

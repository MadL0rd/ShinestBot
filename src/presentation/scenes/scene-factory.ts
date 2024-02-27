import { SceneNames } from './enums/scene-name.enum'
import { IScene, ISceneConfigurationData } from './scene.interface'
import { MainMenuScene } from './implementations/main-menu.scene'
import { OnboardingScene } from './implementations/onboarding.scene'
import { AdminMenuScene } from './implementations/admin-menu/admin-menu.scene'
import { AdminMenuGenerateMetrixScene } from './implementations/admin-menu/admin-menu-generate-metrix.scene'
import { AdminMenuMailingScene } from './implementations/admin-menu/admin-menu-mailing.scene'
import { AdminMenuUsersManagementScene } from './implementations/admin-menu/admin-menu-users-management.scene'
import { LanguageSettingsScene } from './implementations/language-settings.scene'
/** New scene import placeholder */

export class SceneFactory {
    static createSceneWith(
        name: SceneNames.union,
        configuration: ISceneConfigurationData
    ): IScene | null {
        switch (name) {
            case 'mainMenu':
                return new MainMenuScene(configuration)
            case 'onboarding':
                return new OnboardingScene(configuration)
            case 'adminMenu':
                return new AdminMenuScene(configuration)
            case 'adminMenuGenerateMetrix':
                return new AdminMenuGenerateMetrixScene(configuration)
            case 'adminMenuMailing':
                return new AdminMenuMailingScene(configuration)
            case 'adminMenuUsersManagement':
                return new AdminMenuUsersManagementScene(configuration)
            case 'languageSettings':
                return new LanguageSettingsScene(configuration)
            /** New scene generation placeholder */
        }
        return null
    }
}

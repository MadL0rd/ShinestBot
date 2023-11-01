import { SceneName } from './enums/scene-name.enum'
import { IScene, ISceneConfigurationData } from './scene.interface'
import { MainMenuScene } from './implementations/main-menu.scene'
import { OnboardingScene } from './implementations/onboarding.scene'
import { AdminMenuScene } from './implementations/admin-menu/admin-menu.scene'
import { AdminMenuGenerateMetrixScene } from './implementations/admin-menu/admin-menu-generate-metrix.scene'
import { AdminMenuMailingScene } from './implementations/admin-menu/admin-menu-mailing.scene'
import { AdminMenuUsersManagementScene } from './implementations/admin-menu/admin-menu-users-management.scene'
/** New scene import placeholder */

export class SceneFactory {
    static createSceneWith(name: SceneName, configuration: ISceneConfigurationData): IScene | null {
        switch (name) {
            case SceneName.mainMenu:
                return new MainMenuScene(configuration)
            case SceneName.onboarding:
                return new OnboardingScene(configuration)
            case SceneName.adminMenu:
                return new AdminMenuScene(configuration)
            case SceneName.adminMenuGenerateMetrix:
                return new AdminMenuGenerateMetrixScene(configuration)
            case SceneName.adminMenuMailing:
                return new AdminMenuMailingScene(configuration)
            case SceneName.adminMenuUsersManagement:
                return new AdminMenuUsersManagementScene(configuration)
            /** New scene generation placeholder */
        }
    }
}

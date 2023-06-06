import { UserDocument } from 'src/core/user/schemas/user.schema'
import { SceneName } from './enums/scene-name.enum'
import { BotContent } from 'src/core/bot-content/schemas/bot-content.schema'
import { IScene, ISceneConfigurationData } from './scene.interface'
import { MainMenuScene } from './implementations/main-menu.scene'
import { UserService } from 'src/core/user/user.service'
import { OnboardingScene } from './implementations/onboarding.scene'
/** New scene import placeholder */

export class SceneFactory {

    static createSceneWith(name: SceneName, configuration: ISceneConfigurationData): IScene {
        
        switch (name) {
            case SceneName.mainMenu:
                return new MainMenuScene(configuration)
            case SceneName.onboarding:
                return new OnboardingScene(configuration)
            case SceneName.adminMenu:
                return new MainMenuScene(configuration)
            /** New scene generation placeholder */
            default:
                return new MainMenuScene(configuration)
        }
    }
}

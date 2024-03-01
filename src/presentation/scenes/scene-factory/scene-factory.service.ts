import { Injectable } from '@nestjs/common'
import { SceneName } from '../models/scene-name.enum'
import { MainMenuScene } from 'src/presentation/scenes/implementations/main-menu.scene'
import { IScene } from '../models/scene.interface'
import { SceneInjectionsProviderService } from './scene-injections-provider.service'
import { OnboardingScene } from 'src/presentation/scenes/implementations/onboarding.scene'
import { AdminMenuScene } from 'src/presentation/scenes/implementations/admin-menu.scene'
import { AdminMenuGenerateMetrixScene } from 'src/presentation/scenes/implementations/admin-menu-generate-metrix.scene'
/** New scene import placeholder */

@Injectable()
export class SceneFactoryService {
    constructor(private readonly injectionsProvider: SceneInjectionsProviderService) {}

    createSceneWith(name: SceneName.union): IScene | null {
        switch (name) {
            case 'mainMenu':
                return this.injectionsProvider.resolve(MainMenuScene)
            case 'onboarding':
                return this.injectionsProvider.resolve(OnboardingScene)
            case 'adminMenu':
                return this.injectionsProvider.resolve(AdminMenuScene)
            case 'adminMenuGenerateMetrix':
                return this.injectionsProvider.resolve(AdminMenuGenerateMetrixScene)
            /** New scene generation placeholder */
        }
        return null
    }
}

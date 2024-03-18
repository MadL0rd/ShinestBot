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
            case 'adminMenuGenerateMetrics':
                return this.injectionsProvider.resolve(AdminMenuGenerateMetricsScene)
            case 'adminMenuUsersManagementScene':
                return this.injectionsProvider.resolve(AdminMenuUsersManagementSceneScene)
            case 'adminMenuMailingScene':
                return this.injectionsProvider.resolve(AdminMenuMailingSceneScene)
            case 'languageSettingsScene':
                return this.injectionsProvider.resolve(LanguageSettingsSceneScene)
            /** New scene generation placeholder */
        }
        return null
    }
}

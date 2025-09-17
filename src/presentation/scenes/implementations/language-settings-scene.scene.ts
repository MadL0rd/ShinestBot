import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { LanguageCode } from 'src/utils/languages-info/getLanguageName'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { Scene } from '../models/scene.abstract'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export interface LanguageSettingsSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'languageSettings'
    readonly nextScene?: SceneEntrance.SomeSceneDto
}
type SceneEnterData = LanguageSettingsSceneEntranceDto
type SceneData = {
    readonly nextScene?: SceneEntrance.SomeSceneDto
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class LanguageSettingsScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'languageSettings'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly botContentService: BotContentService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => LanguageCode.getLanguageName(code))

        await this.ddi.sendHtml(
            this.text.common.textSelectLanguage,
            super.keyboardMarkupWithAutoLayoutFor(languagesButtons, { columnsCount: 2 })
        )

        return this.completion.inProgress({ nextScene: data?.nextScene })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = dataRaw as SceneData | undefined

        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => LanguageCode.getLanguageName(code))
        const languageIndex = languagesButtons.indexOf(message.text)
        const selectedLanguage = languages[languageIndex]
        if (!selectedLanguage) return this.completion.canNotHandle()

        this.user.language = selectedLanguage
        await this.userService.update(this.user, ['language'])
        return this.completion.complete(data?.nextScene)
    }

    // =====================
    // Private methods
    // =====================
}

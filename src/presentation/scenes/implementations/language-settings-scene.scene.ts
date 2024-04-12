import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { LanguageCode } from 'src/utils/languages-info/getLanguageName'

// =====================
// Scene data classes
// =====================
export class LanguageSettingsSceneSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'languageSettings'
    readonly nextScene?: SceneEntrance.SomeSceneDto
}
type SceneEnterDataType = LanguageSettingsSceneSceneEntranceDto
interface ISceneData {
    readonly nextScene?: SceneEntrance.SomeSceneDto
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class LanguageSettingsSceneScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'languageSettings'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly botContentService: BotContentService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(
        ctx: Context,
        data?: SceneEnterDataType
    ): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory({ type: 'startSceneLanguageSettingsScene' })

        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => LanguageCode.getLanguageName(code))

        await ctx.replyWithHTML(
            this.text.common.selectLanguageText,
            super.keyboardMarkupWithAutoLayoutFor(languagesButtons, true)
        )

        return this.completion.inProgress({ nextScene: data?.nextScene })
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data = dataRaw as ISceneData | undefined

        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})

        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => LanguageCode.getLanguageName(code))
        const languageIndex = languagesButtons.indexOf(message.text)
        const selectedLanguage = languages[languageIndex]
        if (!selectedLanguage) return this.completion.canNotHandle({})

        this.user.internalInfo.language = selectedLanguage
        await this.userService.update(this.user)
        return this.completion.complete(data?.nextScene)
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
}

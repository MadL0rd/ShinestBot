import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../scene.interface'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { getFlagEmoji } from 'src/utils/getFlagEmoji'

// =====================
// Scene data class
// =====================
interface ISceneData {}

export class LanguageSettingsScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.languageSettings
    get dataDefault(): ISceneData {
        return this.generateData({})
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneLanguageSettings)

        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => `${getFlagEmoji(code)} ${code}`)

        await ctx.replyWithHTML(
            this.text.common.selectLanguageText,
            super.keyboardMarkupWithAutoLayoutFor(languagesButtons, true)
        )

        return this.completion.inProgress(this.generateData({}))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        const message = ctx.message as Message.TextMessage
        const messageText = message?.text
        if (!messageText) this.completion.canNotHandle()

        const languages = await this.botContentService.getLocalLanguages()
        const languagesButtons = languages.map((code) => `${getFlagEmoji(code)} ${code}`)
        const languageIndex = languagesButtons.indexOf(messageText)
        if (languageIndex && languageIndex >= 0) this.completion.canNotHandle()

        this.user.internalInfo.language = languages[languageIndex]
        await this.userService.update(this.user)
        return this.completion.complete(SceneName.onboarding)
    }

    async handleCallback(
        ctx: Context<Update>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
}

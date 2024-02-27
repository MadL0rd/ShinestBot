// import { Context } from 'telegraf'
// import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneNames } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../scene.interface'
import { Context, Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { OnboardingPage } from 'src/core/bot-content/schemas/models/bot-content.onboarding-page'
import { Update, Message } from 'node_modules/telegraf/typings/core/types/typegram'

// =====================
// Scene data class
// =====================
interface ISceneData {
    onboardingPageIndex: number
    continueButtonText: string
}

export class OnboardingScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneNames.union = 'onboarding'
    get dataDefault(): ISceneData {
        return this.generateData({
            onboardingPageIndex: 1,
            continueButtonText: 'Далее',
        })
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory(this.historyEvent.startSceneOnboarding)

        const onboardingPageIndex = 0
        const page = this.content.onboarding[onboardingPageIndex]
        await this.showOnboardingPage(ctx, page)

        return this.completion.inProgress({
            onboardingPageIndex: 0,
            continueButtonText: page.buttonText,
        })
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data: ISceneData = this.restoreData(dataRaw)
        const message = ctx.message as Message.TextMessage

        if (data.continueButtonText === message?.text) {
            const nextPageIndex = data.onboardingPageIndex + 1
            const page = this.content.onboarding[nextPageIndex]

            if (page) {
                await this.showOnboardingPage(ctx, page)

                return this.completion.inProgress(
                    this.generateData({
                        onboardingPageIndex: nextPageIndex,
                        continueButtonText: page.buttonText,
                    })
                )
            } else {
                return this.completion.complete('mainMenu')
            }
        }

        return this.completion.canNotHandle(data)
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

    private async showOnboardingPage(ctx: Context<Update>, page?: OnboardingPage): Promise<void> {
        if (!page) return

        await ctx.replyWithHTML(
            page.messageText,
            super.keyboardMarkupWithAutoLayoutFor([page.buttonText])
        )
        await this.replyMediaContent(ctx, page.media)
    }
}

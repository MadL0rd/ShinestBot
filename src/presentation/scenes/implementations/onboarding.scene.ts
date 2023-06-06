import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene } from '../scene.interface'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { OnboardingPage } from 'src/core/bot-content/schemas/bot-content.schema'

// =====================
// Scene data class
// =====================
interface ISceneData {
    onboardingPageIndex: number
    continueButtonText: string
}

export class OnboardingScene extends Scene {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.onboarding

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneOnboarding)

        const onboardingPageIndex = 0
        const page = this.content.onboarding[onboardingPageIndex]
        await this.showOnboardingPage(ctx, page)

        return this.completion.inProgress(
            this.generateData({
                onboardingPageIndex: onboardingPageIndex + 1,
                continueButtonText: page.buttonText,
            })
        )
    }

    async handleMessage(ctx: Context<Update>, dataRaw: Object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        let data: ISceneData = this.restoreData(dataRaw)
        const message = ctx.message as Message.TextMessage

        if (data.continueButtonText === message?.text) {
            const page = this.content.onboarding[data.onboardingPageIndex]

            if (page) {
                await this.showOnboardingPage(ctx, page)

                return this.completion.inProgress(
                    this.generateData({
                        onboardingPageIndex: data.onboardingPageIndex + 1,
                        continueButtonText: page.buttonText,
                    })
                )
            } else {
                return this.completion.complete()
            }
        }

        return this.completion.canNotHandle(data)
    }

    async handleCallback(ctx: Context<Update>, dataRaw: Object): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private generateData(data: ISceneData): ISceneData {
        return data
    }

    private restoreData(dataRaw: object): ISceneData {
        const data: ISceneData = dataRaw as ISceneData
        return (
            data ??
            this.generateData({
                onboardingPageIndex: 1,
                continueButtonText: 'Continue',
            })
        )
    }

    private async showOnboardingPage(ctx: Context<Update>, page?: OnboardingPage): Promise<void> {
        if (page) {
            logger.log(page.messageText)
            ctx.replyWithMarkdownV2(
                page.messageText,
                super.keyboardMarkupWithAutoLayoutFor([page.buttonText])
            )
        }
    }
}

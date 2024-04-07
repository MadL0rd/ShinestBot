import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/types'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { OnboardingPage } from 'src/business-logic/bot-content/schemas/models/bot-content.onboarding-page'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class OnboardingSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'onboarding'
}
type SceneEnterDataType = OnboardingSceneEntranceDto
interface ISceneData {
    onboardingPageIndex: number
    continueButtonText: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class OnboardingScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'onboarding'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(protected readonly userService: UserService) {
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
        await this.logToUserHistory({ type: 'startSceneOnboarding' })

        const onboardingPageIndex = 0
        const page = this.content.onboarding[onboardingPageIndex]
        await this.showOnboardingPage(ctx, page)

        return this.completion.inProgress({
            onboardingPageIndex: onboardingPageIndex,
            continueButtonText: page.buttonText,
        })
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data = this.restoreData(dataRaw)
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
                return this.completion.complete()
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

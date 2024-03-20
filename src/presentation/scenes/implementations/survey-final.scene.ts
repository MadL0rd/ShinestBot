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
import { SurveyDataProviderType } from 'src/presentation/survey-data-provider/models/survey-data-provider.interface'
import { SurveyDataProviderFactoryService } from 'src/presentation/survey-data-provider/survey-provider-factory/survey-provider-factory.service'
import { SurveyFormatter } from 'src/utils/survey-formatter'

// =====================
// Scene data classes
// =====================
export class SurveyFinalSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyFinal'
    readonly provider: SurveyDataProviderType.Union
}
type SceneEnterDataType = SurveyFinalSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType.Union
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyFinalScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'surveyFinal'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly dataProviderFactory: SurveyDataProviderFactoryService
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
        await this.logToUserHistory(this.historyEvent.startSceneSurveyFinal)

        if (!data) {
            logger.error('Scene start data corrupted')
            return this.completion.complete()
        }
        const provider = this.dataProviderFactory.getSurveyProvider(data.provider)
        const cache = await provider.getAnswersCacheStable(this.content, this.user)

        const answersText = SurveyFormatter.generateTextFromPassedAnswers(cache, this.content)

        await ctx.replyWithHTML(answersText)
        await ctx.replyWithHTML(
            this.text.surveyFinal.text,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyFinal.buttonDone,
                this.text.common.buttonReturnToMainMenu,
            ])
        )

        return this.completion.inProgress({
            provider: data.provider,
        })
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )

        const data = this.restoreData(dataRaw)
        if (!data || !data.provider) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        const message = ctx.message
        if (!message || !('text' in message))
            return this.completion.canNotHandle({ provider: data.provider })

        switch (message.text) {
            case this.text.surveyFinal.buttonDone:
            // TODO: implement final action

            case this.text.common.buttonReturnToMainMenu:
                return this.completion.complete({ sceneName: 'mainMenu' })
        }

        return this.completion.canNotHandle({ provider: data.provider })
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

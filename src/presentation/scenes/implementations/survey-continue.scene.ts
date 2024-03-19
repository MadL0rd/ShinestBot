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

// =====================
// Scene data classes
// =====================
export class SurveyContinueSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'surveyContinue'
    readonly provider: SurveyDataProviderType
}
type SceneEnterDataType = SurveyContinueSceneEntranceDto
interface ISceneData {
    readonly provider: SurveyDataProviderType
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class SurveyContinueScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'surveyContinue'
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
        await this.logToUserHistory(this.historyEvent.startSceneSurveyContinue)

        if (!data) {
            logger.error('Start data corrupted')
            return this.completion.complete()
        }

        await ctx.replyWithHTML(
            this.text.surveyContinue.text,
            super.keyboardMarkupWithAutoLayoutFor([
                this.text.surveyContinue.buttonResume,
                this.text.surveyContinue.buttonBegining,
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
        if (!message || !('text' in message)) {
            return this.completion.canNotHandle({
                provider: data.provider,
            })
        }

        switch (message.text) {
            case this.text.surveyContinue.buttonResume:
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })

            case this.text.surveyContinue.buttonBegining:
                const provider = this.dataProviderFactory.getSurveyProvider(data.provider)
                await provider.clearAnswersCache(this.user)
                return this.completion.complete({
                    sceneName: 'survey',
                    provider: data.provider,
                    allowContinueQuestion: false,
                })
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
}

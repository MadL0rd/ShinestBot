import { logger } from 'src/app.logger'
import { UserService } from 'src/core/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import moment from 'moment'
import { SceneCallbackData } from '../models/scene-callback'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { Scene } from '../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'
import { StatisticService } from 'src/core/user/statistic.service'
import { internalConstants } from 'src/app.internal-constants'
import { FileName } from '../models/file-name.enum'

// =====================
// Scene data classes
// =====================
export class AdminMenuGenerateMetrixSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuGenerateMetrix'
}
type SceneEnterDataType = AdminMenuGenerateMetrixSceneEntranceDto
interface ISceneData {}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuGenerateMetrixScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.union = 'adminMenuGenerateMetrix'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected readonly userService: UserService,
        private readonly statisticService: StatisticService
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
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenuGenerateMetrix)

        await ctx.replyWithHTML(this.text.adminMenuMetrics.selectDateText, this.menuMarkup())

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})

        const currentDate = new Date()
        let beginningDate: Date | null = null

        switch (message?.text) {
            case this.text.adminMenuMetrics.selectDateMonth:
                if (currentDate.getMonth() !== 0) {
                    beginningDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        currentDate.getDay()
                    )
                } else {
                    beginningDate = new Date(
                        currentDate.getFullYear() - 1,
                        11,
                        currentDate.getDay()
                    )
                }
                break

            case this.text.adminMenuMetrics.selectDateQuarter:
                if (currentDate.getMonth() > 2) {
                    beginningDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 3,
                        currentDate.getDay()
                    )
                } else {
                    switch (currentDate.getMonth()) {
                        case 2:
                            beginningDate = new Date(
                                currentDate.getFullYear() - 1,
                                11,
                                currentDate.getDay()
                            )
                            break
                        case 1:
                            beginningDate = new Date(
                                currentDate.getFullYear() - 1,
                                10,
                                currentDate.getDay()
                            )
                            break
                        case 0:
                            beginningDate = new Date(
                                currentDate.getFullYear() - 1,
                                9,
                                currentDate.getDay()
                            )
                            break
                    }
                }
                break

            case this.text.adminMenuMetrics.selectDateYear:
                beginningDate = new Date(currentDate.getFullYear(), 0, 1)
                break

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })
        }
        if (beginningDate) {
            const dateFormat = 'DD.MM.yyyy'
            const beginningDateString = moment(beginningDate)
                .utcOffset(internalConstants.appTimeZoneUtcOffset)
                .format(dateFormat)
            const currentDateString = moment(currentDate)
                .utcOffset(internalConstants.appTimeZoneUtcOffset)
                .format(dateFormat)
            const resultFileName = `${FileName.statisticsMain} c ${beginningDateString} по ${currentDateString}.xlsx`
            const resultMetricsTable = await this.statisticService.createTable(
                beginningDate,
                currentDate
            )
            await ctx.replyWithDocument({
                source: resultMetricsTable,
                filename: resultFileName,
            })
            return this.completion.complete({ sceneName: 'adminMenu' })
        }

        return this.completion.canNotHandle({})
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
    private menuMarkup(): object {
        return this.keyboardMarkupWithAutoLayoutFor([
            this.text.adminMenuMetrics.selectDateMonth,
            this.text.adminMenuMetrics.selectDateQuarter,
            this.text.adminMenuMetrics.selectDateYear,
            this.text.adminMenu.returnBack,
        ])
    }
}

import { StatisticService } from 'src/business-logic/user/statistic.service'
import { UserService } from 'src/business-logic/user/user.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export interface AdminMenuGenerateMetricsSceneEntranceDto extends SceneEntrance.Dto {
    readonly sceneName: 'adminMenuGenerateMetrics'
}
type SceneEnterData = AdminMenuGenerateMetricsSceneEntranceDto
type SceneData = {
    state: SceneState
    stat?: 'main' | 'redirect'
}

type SceneState = 'default' | 'chosePeriod'

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuGenerateMetricsScene extends Scene<SceneData, SceneEnterData> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuGenerateMetrics'
    protected override get dataDefault(): SceneData {
        return {} as SceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly statisticService: StatisticService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterData): Promise<SceneHandlerCompletion> {
        return this.initState({ state: 'default' })
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        // state handler
        switch (data.state) {
            case 'default': {
                return await this.handleDefaultState(message.text, ctx, data)
            }
            case 'chosePeriod': {
                return await this.handleChosePeriodState(message.text, ctx, data)
            }
        }
    }

    // =====================
    // State methods
    // =====================
    private async initState(data: SceneData): Promise<SceneHandlerCompletion> {
        switch (data.state) {
            case 'default': {
                await this.ddi.sendHtml(
                    this.text.adminMenuMetrics.selectDateText,
                    this.menuMarkup()
                )
                break
            }

            case 'chosePeriod': {
                await this.sendChosePeriodMessage()
                break
            }
        }
        return this.completion.inProgress(data)
    }

    private async handleDefaultState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: SceneData
    ): Promise<SceneHandlerCompletion> {
        switch (messageText) {
            case this.text.adminMenuMetrics.getMainStat:
                data.stat = 'main'
                data.state = 'chosePeriod'
                return this.initState(data)

            case this.text.adminMenuMetrics.getRedirectStat:
                data.stat = 'redirect'
                data.state = 'chosePeriod'
                return this.initState(data)

            case this.text.adminMenuMetrics.getUsersInfo: {
                const resultTable = await this.statisticService.createUsersInfoTable()
                const botUsername = this.ddi.bot.botInfo?.username
                await this.ddi.sendDocument({
                    document: {
                        source: resultTable,
                        filename: `Пользователи ${botUsername} ${Date.new().moment().format('DD.MM.yyyy')}.xlsx`,
                    },
                })
                return this.completion.complete({ sceneName: 'adminMenu' })
            }

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                return this.completion.canNotHandle()
        }
    }

    private async sendChosePeriodMessage() {
        const markup = this.keyboardMarkup([
            [
                this.text.adminMenuMetrics.selectDateMonth,
                this.text.adminMenuMetrics.selectDateQuarter,
                this.text.adminMenuMetrics.selectDateYear,
            ],
            [this.text.adminMenuMetrics.selectDateYearPrevious],
            [this.text.common.buttonBackToPreviousMenu],
        ])
        await this.ddi.sendHtml(this.text.adminMenuMetrics.selectDateText, markup)
    }

    private async handleChosePeriodState(
        messageText: string,
        ctx: ExtendedMessageContext,
        data: SceneData
    ) {
        const currentDate = new Date()

        let endDate = Date.new()
        let startDate: Date | null = null

        switch (messageText) {
            case this.text.adminMenuMetrics.selectDateMonth:
                if (currentDate.getMonth() !== 0) {
                    startDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        currentDate.getDay()
                    )
                } else {
                    startDate = new Date(currentDate.getFullYear() - 1, 11, currentDate.getDay())
                }
                break

            case this.text.adminMenuMetrics.selectDateQuarter:
                switch (currentDate.getMonth()) {
                    case 0:
                        startDate = new Date(currentDate.getFullYear() - 1, 9, currentDate.getDay())
                        break
                    case 1:
                        startDate = new Date(
                            currentDate.getFullYear() - 1,
                            10,
                            currentDate.getDay()
                        )
                        break
                    case 2:
                        startDate = new Date(
                            currentDate.getFullYear() - 1,
                            11,
                            currentDate.getDay()
                        )
                        break

                    default:
                        startDate = new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth() - 3,
                            currentDate.getDay()
                        )
                }
                break

            case this.text.adminMenuMetrics.selectDateYear:
                startDate = new Date(currentDate.getFullYear(), 0, 1)
                break

            case this.text.adminMenuMetrics.selectDateYearPrevious: {
                const prevYear = currentDate.getFullYear() - 1
                startDate = new Date(prevYear, 0, 1)
                endDate = new Date(prevYear, 11, 31)
                break
            }

            case this.text.common.buttonBackToPreviousMenu:
                data.state = 'default'
                return this.initState(data)

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                return this.completion.canNotHandle()
        }

        if (!startDate) {
            return this.completion.canNotHandle()
        }

        switch (data.stat) {
            case 'main':
                this.prepareAndSendMainStatistic({ startDate, endDate })
                return this.completion.complete({ sceneName: 'adminMenu' })
            case 'redirect':
                this.prepareAndSendRedirectStatistics({ startDate, endDate })
                return this.completion.complete({ sceneName: 'adminMenu' })
            default:
                return this.completion.canNotHandle()
        }
    }

    // =====================
    // Private methods
    // =====================
    private menuMarkup(): object {
        return this.keyboardMarkup([
            [this.text.adminMenuMetrics.getMainStat, this.text.adminMenuMetrics.getRedirectStat],
            this.text.adminMenuMetrics.getUsersInfo,
            this.text.adminMenu.returnBack,
        ])
    }

    private async prepareAndSendMainStatistic(args: { startDate: Date; endDate: Date }) {
        const { startDate, endDate } = args

        const dateFormat = 'DD.MM.yyyy'
        const beginningDateString = startDate.moment().format(dateFormat)
        const currentDateString = endDate.moment().format(dateFormat)
        const metricsFileName = `Статистика основное c ${beginningDateString} по ${currentDateString}.xlsx`

        const resultMetricsTable = await this.statisticService.createStatisticTable({
            startDate,
            endDate,
            addAllUsersPage: true,
        })
        await this.ddi.sendDocument({
            document: {
                source: resultMetricsTable,
                filename: metricsFileName,
            },
        })
    }

    private async prepareAndSendRedirectStatistics(args: { startDate: Date; endDate: Date }) {
        const { startDate, endDate } = args

        const dateFormat = 'DD.MM.yyyy'
        const beginningDateString = startDate.moment().format(dateFormat)
        const currentDateString = endDate.moment().format(dateFormat)
        const redirectLinkStatFileName = `Статистика редиректов c ${beginningDateString} по ${currentDateString}.xlsx`
        const resultRedirectLinkStatTable = await this.statisticService.createRedirectLinkTable(
            startDate,
            endDate
        )
        await this.ddi.sendDocument({
            document: {
                source: resultRedirectLinkStatTable,
                filename: redirectLinkStatFileName,
            },
        })
    }
}

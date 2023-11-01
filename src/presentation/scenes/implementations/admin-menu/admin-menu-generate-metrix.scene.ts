import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import moment from 'moment'
import 'moment-timezone'
import { SceneName } from '../../enums/scene-name.enum'
import {
    SceneHandlerCompletion,
    Scene,
    PermissionsValidationResult,
    SceneCallbackData,
} from '../../scene.interface'
import { logger } from 'src/app.logger'
import { UserPermissions } from '../../../../core/user/enums/user-permissions.enum'
import { StatisticService } from '../../../../core/user/statistic.service'
import { FileName } from '../../enums/file-name.enum'
import { internalConstants } from 'src/app.internal-constants'
// =====================
// Scene data class
// =====================
interface ISceneData {}

export class AdminMenuGenerateMetrixScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.adminMenuGenerateMetrix

    // =====================
    // Public methods
    // =====================

    validateUseScenePermissions(): PermissionsValidationResult {
        const ownerOrAdmin =
            this.userActivePermissions.includes(UserPermissions.admin) ||
            this.userActivePermissions.includes(UserPermissions.owner)
        if (ownerOrAdmin) {
            return { canUseScene: true }
        }
        return { canUseScene: false }
    }

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenuGenerateMetrix)

        await ctx.replyWithHTML(this.text.adminMenuMetrics.selectDateText, this.menuMarkup())

        return this.completion.inProgress()
    }

    async handleMessage(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        const message = ctx.message as Message.TextMessage
        const currentDate = new Date()
        let beginningDate: Date

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
                return this.completion.complete(SceneName.adminMenu)
        }
        if (beginningDate) {
            const statisticService = new StatisticService(this.userService, this.botContentService)
            const dateFormat = 'DD.MM.yyyy'
            const beginningDateString = moment(beginningDate)
                .tz(internalConstants.appTimeZone)
                .format(dateFormat)
                .toString()
            const currentDateString = moment(currentDate)
                .tz(internalConstants.appTimeZone)
                .format(dateFormat)
                .toString()
            const resultFileName = `${FileName.statisticsMain} c ${beginningDateString} по ${currentDateString}.xlsx`
            const resultMetricsTable = await statisticService.createTable(
                beginningDate,
                currentDate
            )
            await ctx.replyWithDocument({
                source: resultMetricsTable,
                filename: resultFileName,
            })
            return this.completion.complete(SceneName.adminMenu)
        }

        return this.completion.canNotHandle()
    }

    async handleCallback(
        ctx: Context<Update>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
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

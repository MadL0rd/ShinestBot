import { Injectable } from '@nestjs/common'
import { AgregationType } from './enums/agregation-type.enum'
import { UserHistoryEvent } from './enums/user-history-event.enum'
import { CreateStatisticTableDto } from './dto/create-statistic-table.dto'
import * as XLSX from 'xlsx'
import { UserService } from './user.service'

@Injectable()
export class StatisticService {
    constructor(private readonly userService: UserService) {}

    async createTable(beginningDate: Date, endingDate: Date): Promise<Buffer> {
        const wb = { Sheets: {}, SheetNames: [] }
        const mainStatsArr: CreateStatisticTableDto[] = [
            {
                event: 'start',
                agregationType: AgregationType.sum,
                tableTitle: 'Старт',
            },
            {
                event: 'startSceneOnboarding',
                agregationType: AgregationType.sum,
                tableTitle: 'Перешел в онбординг',
            },
        ]

        const mainWs = await this.createMainWs(
            beginningDate,
            endingDate,
            AgregationType.sum,
            mainStatsArr
        )

        XLSX.utils.book_append_sheet(wb, mainWs, 'Общее Сумма', true)

        const uniqueStatsArr = mainStatsArr.map((elem) => {
            elem.agregationType = AgregationType.uniqueUserActions
            return elem
        })

        const uniqueMainWs = await this.createMainWs(
            beginningDate,
            endingDate,
            AgregationType.uniqueUserActions,
            uniqueStatsArr
        )
        XLSX.utils.book_append_sheet(wb, uniqueMainWs, 'Общее Уник.польз', true)

        const usersStartParamsWs = await this.createStartParamsWs(beginningDate, endingDate)
        XLSX.utils.book_append_sheet(wb, usersStartParamsWs, 'Старт.значение', true)

        return XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'buffer',
        })
    }

    private async mainStats(
        beginningDate: Date,
        endingDate: Date,
        tablesData: CreateStatisticTableDto[]
    ): Promise<string[][]> {
        const tableRows: string[] = []
        for (
            let d = new Date(beginningDate);
            d <= new Date(endingDate);
            d.setDate(d.getDate() + 1)
        ) {
            tableRows.push(`${d.toLocaleDateString('en-GB')}`)
        }
        const tableContent: string[][] = tableRows.map((item) => [item])

        for (const data of tablesData) {
            const statisticMap = await this.prepareStatisticByEvent(
                beginningDate,
                endingDate,
                data.event,
                data.agregationType
            )

            for (const row of tableContent) {
                const value = statisticMap.get(row[0])
                if (value) {
                    row.push(value.toString())
                } else {
                    row.push('0')
                }
            }
        }
        return tableContent
    }

    private async prepareStatisticByEvent(
        beginningDate: Date,
        endingDate: Date,
        event: UserHistoryEvent.EventTypeName,
        agregationType: AgregationType,
        paragraphId = null
    ): Promise<Map<string, number>> {
        const statistics = new Map<string, number>()

        const userTgIds = await this.userService.findAllTelegramIds()

        for (const telegramId of userTgIds) {
            const userHistory = await this.userService.findUserHistoryByTelegramId(telegramId)
            if (!userHistory) continue

            let currentEvents: typeof userHistory.eventsHistory = []
            if (paragraphId) {
                currentEvents = userHistory.eventsHistory.filter(
                    (record) =>
                        record.date > beginningDate &&
                        record.date < endingDate &&
                        record.type === event
                    // &&
                    // record.content === paragraphId
                )
            }
            // else {
            //     currentEvents = userHistory.filter(
            //         (record) =>
            //             record.timeStamp > beginningDate &&
            //             record.timeStamp < endingDate &&
            //             record.event === event
            //     )
            // }

            switch (agregationType) {
                case AgregationType.sum:
                    for (const currentEvent of currentEvents) {
                        const currentDate = currentEvent.date.toLocaleDateString('en-GB')

                        let existingValue = statistics.get(currentDate) ?? 0
                        statistics.set(currentDate, ++existingValue)
                    }
                    break

                case AgregationType.average:
                case AgregationType.list:
                    break

                case AgregationType.uniqueUserActions:
                    const userStatistics = new Map<string, number>()

                    for (const currentEvent of currentEvents) {
                        const currentDate = currentEvent.date.toLocaleDateString('en-GB')

                        userStatistics.set(currentDate, 1)
                    }

                    for (const [dateKey, value] of userStatistics) {
                        const existingValue = statistics.get(dateKey) ?? 0
                        statistics.set(dateKey, existingValue + value)
                    }
                    break
            }
        }

        return statistics
    }

    private async createMainWs(
        beginningDate: Date,
        endingDate: Date,
        agregationTpe: AgregationType,
        mainStatsArr: CreateStatisticTableDto[]
    ): Promise<XLSX.WorkSheet> {
        const header = [['Тип агрегирования:', agregationTpe]]
        const mainWs = XLSX.utils.aoa_to_sheet(header)
        mainWs['!cols'] = [{ wch: 11 }]

        const mainTableTitle = ['Дата / Событие']
        mainStatsArr.forEach((mainStat) => mainTableTitle.push(mainStat.tableTitle))
        XLSX.utils.sheet_add_aoa(mainWs, [mainTableTitle], { origin: 'A3' })
        mainWs['!cols'] = this.fitToColumn([mainTableTitle])

        const mainContent = await this.mainStats(beginningDate, endingDate, mainStatsArr)
        XLSX.utils.sheet_add_aoa(mainWs, mainContent, { origin: 'A4' })

        return mainWs
    }

    private async createStartParamsWs(
        beginningDate: Date,
        endingDate: Date
    ): Promise<XLSX.WorkSheet> {
        const header = [['Тип агрегирования:', AgregationType.list]]
        const paramsWs = XLSX.utils.aoa_to_sheet(header)

        const paramsTableTitle = ['Дата', 'ID телеграм', 'Параметр']
        XLSX.utils.sheet_add_aoa(paramsWs, [paramsTableTitle], { origin: 'A3' })
        paramsWs['!cols'] = this.fitToColumn([paramsTableTitle])
        paramsWs['!cols'][0] = { wch: 20 }

        const users = await this.userService.findAll()
        const usersWithParams = users.filter((user) => user?.internalInfo?.startParam)
        const paramsContent: string[][] = []
        for (const user of usersWithParams) {
            const userHistory = await this.userService.findUserHistoryByTelegramId(user.telegramId)
            if (!userHistory) continue

            const startEvent = userHistory.eventsHistory.find(
                (record) =>
                    record.date > beginningDate &&
                    record.date < endingDate &&
                    record.type === 'start'
            )
            if (startEvent) {
                paramsContent.push([
                    startEvent.date.toLocaleDateString('en-GB'),
                    user.telegramId.toString(),
                    user.internalInfo?.startParam ?? '',
                ])
            }
        }

        XLSX.utils.sheet_add_aoa(paramsWs, paramsContent, { origin: 'A4' })
        return paramsWs
    }

    private fitToColumn(tableContent: string[][]): object[] {
        // get maximum character of each column
        return tableContent[0].map((a, i) => ({
            wch: Math.max(...tableContent.map((a2) => (a2[i] ? a2[i].toString().length + 2 : 10))),
        }))
    }
}

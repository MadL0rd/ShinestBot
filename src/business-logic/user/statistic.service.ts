import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
import * as fs from 'fs'
import { Model } from 'mongoose'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { UserProfile } from 'src/entities/user-profile'
import { ExceptionGuard } from 'src/exceptions-and-logging/exception-guard.decorator'
import { Telegraf } from 'telegraf'
import * as XLSX from 'xlsx'
import { BotContentService } from '../bot-content/bot-content.service'
import { AggregationResultItem } from './dto/aggregation-result-item.dto'
import { SomeEventFilter, StatisticColumnDto } from './dto/event-statistic-column.dto'
import { AggregationType } from './enums/aggregation-type.enum'
import { UserProfileDocument, UserProfileSchema } from './schemas/user.schema'
import { StatisticSheetDto, statisticSheetSchemas } from './statistic-sheets/statistic-sheets.dto'
import { UserEventsLogRepository } from './user-events-log.repo'

type AggregationResultFormattedItem = {
    dateString: string
    totalEvents: number | string
    uniqueUsers: number | string
}

@Injectable()
export class StatisticService implements OnModuleInit {
    constructor(
        @InjectBot('Bot') private readonly bot: Telegraf,
        @InjectModel(UserProfileSchema.name)
        private readonly userModel: Model<UserProfileDocument>,
        private readonly userLogsRepo: UserEventsLogRepository,
        private readonly botContentService: BotContentService
    ) {}

    async onModuleInit() {
        // await this.mockStatisticCalculations()
    }

    private async mockStatisticCalculations() {
        logger.log(`Сбор статистики старт`)
        const start = Date.now()
        const currentDate = new Date()
        let startDate = new Date()
        if (currentDate.getMonth() !== 0) {
            startDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                currentDate.getDay()
            )
        } else {
            startDate = new Date(currentDate.getFullYear() - 1, 11, currentDate.getDay())
        }
        const endDate = currentDate
        const table = await this.createStatisticTable({
            startDate,
            endDate,
            addAllUsersPage: false,
        })
        const diff = Date.now() - start
        const seconds = Math.floor(diff / 1000)
        const ms = diff % 1000

        fs.writeFileSync('./metrics-test.xlsx', table)

        logger.log(`Сбор статистики занял ${seconds}s ${ms}ms`)
        logger.log(`Сбор статистики окончен`)
    }

    @Cron('0 50 23 * * *')
    @ExceptionGuard()
    private async sendDailyStat() {
        logger.log('Start daily statistics table creation')
        const currentDate = new Date()
        const dateFormat = 'DD.MM.yyyy'
        let startDate
        if (currentDate.getMonth() !== 0) {
            startDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                currentDate.getDay()
            )
        } else {
            startDate = new Date(currentDate.getFullYear() - 1, 11, currentDate.getDay())
        }
        const beginningDateString = startDate.moment().format(dateFormat)
        const currentDateString = currentDate.moment().format(dateFormat)
        const resultFileName = `Статистика основное c ${beginningDateString} по ${currentDateString}.xlsx`

        const resultMetricsTable = await this.createStatisticTable({
            startDate,
            endDate: currentDate,
            addAllUsersPage: true,
        })
        await this.bot.telegram.sendDocument(internalConstants.chatIds.fileStorageChatId, {
            source: resultMetricsTable,
            filename: resultFileName,
        })
    }

    async createStatisticTable(args: {
        startDate: Date
        endDate: Date
        addAllUsersPage: boolean
    }): Promise<Buffer> {
        const { startDate, endDate } = args
        const wb = { Sheets: {}, SheetNames: [] }

        const calculateAndAddStatisticSheet = async (
            workBook: XLSX.WorkBook,
            sheetDto: StatisticSheetDto
        ): Promise<void> => {
            const ws = await this.createStatisticWorkSheet({
                beginningDate: startDate,
                endingDate: endDate,
                columnsDto: sheetDto.columns,
            })

            XLSX.utils.book_append_sheet(
                workBook,
                ws.totalEventsCount,
                sheetDto.titles.totalEventsCount
            )
            XLSX.utils.book_append_sheet(
                workBook,
                ws.uniqueUserActions,
                sheetDto.titles.uniqueUserActions
            )
        }
        /**
         * Main ws
         */

        await calculateAndAddStatisticSheet(wb, statisticSheetSchemas.common)

        /**
         * Web apps + Menu buttons
         */
        await calculateAndAddStatisticSheet(wb, statisticSheetSchemas.menuButtons)

        /**
         * Blocs / unblocks
         */
        await calculateAndAddStatisticSheet(wb, statisticSheetSchemas.blockingAndUnblockingTheBot)

        const botContent = await this.botContentService.getContent()

        /**
         * Registration survey
         */
        await calculateAndAddStatisticSheet(wb, {
            titles: {
                totalEventsCount: 'Рег. опрос Сумма',
                uniqueUserActions: 'Рег. опрос Уник.польз',
            },
            columns: botContent.survey.questions.map((question) => {
                return {
                    type: 'data',
                    event: { type: 'surveyQuestionWasShown', questionId: question.id },
                    columnTitle: question.publicTitle,
                }
            }),
        })

        /**
         * Support
         */
        const statisticSheetSchemaSupport = {
            titles: {
                totalEventsCount: 'Поддержка Сумма',
                uniqueUserActions: 'Поддержка Уник.польз',
            },
            columns: [
                {
                    type: 'data',
                    event: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    columnTitle: `Обращение пользователя`,
                },
                {
                    type: 'percentage',
                    eventTotal: { type: 'sceneCanNotHandleUserUpdate' },
                    eventSubset: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventTotalCacheId: 'sceneCanNotHandleUserUpdate:all',
                    eventSubsetCacheId: 'sceneCanNotHandleUserUpdate:unauthorized',
                    columnTitle: 'Обращение пользователя\nunauthorized',
                },
                {
                    type: 'percentage',
                    eventTotal: { type: 'sceneCanNotHandleUserUpdate' },
                    eventSubset: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventTotalCacheId: 'sceneCanNotHandleUserUpdate:all',
                    eventSubsetCacheId: 'sceneCanNotHandleUserUpdate:pending',
                    columnTitle: 'Обращение пользователя\npending',
                },
                {
                    type: 'percentage',
                    eventTotal: { type: 'sceneCanNotHandleUserUpdate' },
                    eventSubset: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventTotalCacheId: 'sceneCanNotHandleUserUpdate:all',
                    eventSubsetCacheId: 'sceneCanNotHandleUserUpdate:authorized',
                    columnTitle: 'Обращение пользователя\nauthorized',
                },

                { type: 'spacer' },
                {
                    type: 'data',
                    event: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventCacheId: 'sceneCanNotHandleUserUpdate:unauthorized',
                    columnTitle: `unauthorized:\nОбращение пользователя`,
                },
                {
                    type: 'data',
                    event: {
                        type: 'userWasManagerMessageTarget',
                    },
                    columnTitle: `unauthorized:\nСообщение менеджера`,
                },

                { type: 'spacer' },
                {
                    type: 'data',
                    event: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventCacheId: 'sceneCanNotHandleUserUpdate:pending',
                    columnTitle: `pending:\nОбращение пользователя`,
                },
                {
                    type: 'data',
                    event: {
                        type: 'userWasManagerMessageTarget',
                    },
                    columnTitle: `pending:\nСообщение менеджера`,
                },

                { type: 'spacer' },
                {
                    type: 'data',
                    event: {
                        type: 'sceneCanNotHandleUserUpdate',
                    },
                    eventCacheId: 'sceneCanNotHandleUserUpdate:authorized',
                    columnTitle: `authorized:\nОбращение пользователя`,
                },
                {
                    type: 'data',
                    event: {
                        type: 'userWasManagerMessageTarget',
                    },
                    columnTitle: `authorized:\nСообщение менеджера`,
                },
            ],
        } as const satisfies StatisticSheetDto
        await calculateAndAddStatisticSheet(wb, statisticSheetSchemaSupport)

        /**
         * Training
         */
        await calculateAndAddStatisticSheet(wb, {
            titles: {
                totalEventsCount: 'Обучение Сумма',
                uniqueUserActions: 'Обучение Уник.польз',
            },
            columns: botContent.training.paragraphs.map((paragraph) => {
                return {
                    type: 'data',
                    event: { type: 'selectedParagraph', paragraphId: paragraph.id },
                    columnTitle: paragraph.name,
                }
            }),
        })

        /**
         * Users info
         */
        if (args.addAllUsersPage) {
            const usersStartParamsWs = await this.createUsersWs()
            XLSX.utils.book_append_sheet(wb, usersStartParamsWs, 'Пользователи')
        }

        return XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'buffer',
        })
    }

    async createUsersInfoTable(): Promise<Buffer> {
        const wb = { Sheets: {}, SheetNames: [] }

        const usersStartParamsWs = await this.createUsersWs()
        XLSX.utils.book_append_sheet(wb, usersStartParamsWs, 'Пользователи')

        return XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'buffer',
        })
    }

    async createRedirectLinkTable(beginningDate: Date, endingDate: Date): Promise<Buffer> {
        const botContent = await this.botContentService.getContent()
        const wb = { Sheets: {}, SheetNames: [] }

        const redirectUniqueStatsArr: StatisticColumnDto[] = []
        botContent.redirectLinks.forEach((link) => {
            redirectUniqueStatsArr.push({
                type: 'data',
                event: { type: 'redirectLink', alias: link.id },
                columnTitle: link.id,
            })
        })

        const statisticSheets = await this.createStatisticWorkSheet({
            beginningDate: beginningDate,
            endingDate: endingDate,
            columnsDto: redirectUniqueStatsArr,
        })
        XLSX.utils.book_append_sheet(
            wb,
            statisticSheets.totalEventsCount,
            'Редиректы уникальные',
            true
        )
        XLSX.utils.book_append_sheet(wb, statisticSheets.uniqueUserActions, 'Редиректы Сумма', true)

        return XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'buffer',
        })
    }

    private async createStatisticWorkSheet(args: {
        beginningDate: Date
        endingDate: Date
        columnsDto: StatisticColumnDto[]
    }): Promise<Record<AggregationType.Union, XLSX.WorkSheet>> {
        const { beginningDate, endingDate, columnsDto } = args

        const statisticContent = await this.aggregateColumnsData({
            startDate: beginningDate,
            endDate: endingDate,
            columns: columnsDto,
        })

        return {
            totalEventsCount: this.makeSheet({
                aggregationType: 'totalEventsCount',
                columnsDto,
                statisticContent: statisticContent.totalEventsCount,
            }),
            uniqueUserActions: this.makeSheet({
                aggregationType: 'uniqueUserActions',
                columnsDto,
                statisticContent: statisticContent.uniqueUserActions,
            }),
        }
    }

    private makeSheet(args: {
        aggregationType: AggregationType.Union
        columnsDto: StatisticColumnDto[]
        statisticContent: (string | number)[][]
    }) {
        const { aggregationType, columnsDto, statisticContent } = args

        const header = [['Тип агрегирования:', AggregationType.names[aggregationType]]]
        const sheet = XLSX.utils.aoa_to_sheet(header)
        sheet['!cols'] = [{ wch: 11 }]

        const { dataColumnTitles, percentageColumnIndices } = columnsDto.reduce(
            (acc, column, index) => {
                switch (column.type) {
                    case 'data':
                        acc.dataColumnTitles.push(column.columnTitle)
                        break

                    case 'percentage':
                        acc.percentageColumnIndices.push(index)
                        acc.dataColumnTitles.push(column.columnTitle)
                        break

                    case 'spacer':
                        acc.dataColumnTitles.push('')
                        break
                }
                return acc
            },
            { dataColumnTitles: ['Дата / Событие'], percentageColumnIndices: [] as number[] }
        )

        XLSX.utils.sheet_add_aoa(sheet, [dataColumnTitles], { origin: 'A3' })
        sheet['!cols'] = this.fitColumnsByTitle(dataColumnTitles)

        XLSX.utils.sheet_add_aoa(sheet, statisticContent, { origin: 'A4' })

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        const offset = {
            horizontal: 1, // skip dates column
            vertical: 4, // skip titles
        }
        for (const i of percentageColumnIndices) {
            let letterIndex = offset.horizontal + i
            let cellLettersIndex = ''

            while (letterIndex >= 0) {
                cellLettersIndex = letters[letterIndex % letters.length] + cellLettersIndex
                letterIndex =
                    letterIndex >= letters.length
                        ? Math.round(letterIndex / letters.length) - 1
                        : -1
            }

            if (!cellLettersIndex) break
            for (let index = 0; index < statisticContent.length; index++) {
                try {
                    sheet[`${cellLettersIndex}${offset.vertical + index}`].z = '0.0%'
                } catch (e) {
                    logger.log(e)
                }
            }
        }

        return sheet
    }

    private async aggregateColumnsData(args: {
        startDate: Date
        endDate: Date
        columns: StatisticColumnDto[]
    }): Promise<Record<AggregationType.Union, (string | number)[][]>> {
        const { startDate, endDate, columns } = args

        const tableRowsDates: string[] = []
        for (
            let date = new Date(startDate);
            date <= new Date(endDate);
            date.setDate(date.getDate() + 1)
        ) {
            tableRowsDates.push(`${date.formattedWithAppTimeZone('YYYY-MM-DD')}`)
        }

        const aggregationCacheByFilter = columns.reduce(
            (acc, column) => {
                switch (column.type) {
                    case 'data':
                        acc.set(column.eventCacheId ?? JSON.stringify(column.event), {
                            filter: column.event,
                            result: null,
                        })
                        break

                    case 'percentage':
                        acc.set(column.eventTotalCacheId ?? JSON.stringify(column.eventTotal), {
                            filter: column.eventTotal,
                            result: null,
                        })
                        acc.set(column.eventSubsetCacheId ?? JSON.stringify(column.eventSubset), {
                            filter: column.eventSubset,
                            result: null,
                        })
                        break

                    case 'spacer':
                        break
                }
                return acc
            },
            new Map() as Map<
                string,
                { filter: SomeEventFilter; result: Map<string, AggregationResultItem> | null }
            >
        )
        await Array.from(aggregationCacheByFilter.keys())
            .map(async (key) => {
                const item = aggregationCacheByFilter.get(key)
                if (!item) return
                item.result = await this.userLogsRepo.aggregateEventStatisticByDates({
                    dateStart: startDate,
                    dateEnd: endDate,
                    eventFilter: item.filter,
                })
            })
            .combinePromises()

        const columnsData = columns.map((column) => {
            switch (column.type) {
                case 'data': {
                    return (
                        aggregationCacheByFilter.get(
                            column.eventCacheId ?? JSON.stringify(column.event)
                        )?.result ?? null
                    )
                }
                case 'percentage': {
                    const eventTotalResult = aggregationCacheByFilter.get(
                        column.eventTotalCacheId ?? JSON.stringify(column.eventTotal)
                    )?.result
                    const eventSubsetResult = aggregationCacheByFilter.get(
                        column.eventSubsetCacheId ?? JSON.stringify(column.eventSubset)
                    )?.result
                    if (!eventTotalResult || !eventSubsetResult) return null

                    return tableRowsDates.reduce(
                        (acc, dateString) => {
                            const eventTotalDayResult = eventTotalResult.get(dateString)
                            const eventSubsetDayResult = eventSubsetResult.get(dateString)
                            if (eventTotalDayResult && eventSubsetDayResult) {
                                const totalEvents =
                                    eventSubsetDayResult.totalEvents /
                                    eventTotalDayResult.totalEvents
                                const uniqueUsers =
                                    eventSubsetDayResult.uniqueUsers /
                                    eventTotalDayResult.uniqueUsers
                                acc.set(dateString, {
                                    dateString: dateString,
                                    totalEvents,
                                    uniqueUsers,
                                })
                            }

                            return acc
                        },
                        new Map() as Map<string, AggregationResultFormattedItem>
                    )
                }

                case 'spacer':
                    return null
            }
        })

        return {
            totalEventsCount: tableRowsDates.map((dateString) => {
                return columnsData.reduce(
                    (tableRow, item) => {
                        tableRow.push(item ? (item.get(dateString)?.totalEvents ?? 0) : '')
                        return tableRow
                    },
                    [dateString] as (string | number)[]
                )
            }),
            uniqueUserActions: tableRowsDates.map((dateString) => {
                return columnsData.reduce(
                    (tableRow, item) => {
                        tableRow.push(item ? (item.get(dateString)?.uniqueUsers ?? 0) : '')
                        return tableRow
                    },
                    [dateString] as (string | number)[]
                )
            }),
        }
    }

    private async createUsersWs(): Promise<XLSX.WorkSheet> {
        const paramsTableTitle = [
            'Дата регистрации',
            'ID телеграм',
            'Статус',
            'Заблокировал',
            'Удалился из тг',
            'Username',
            'UTM (список)',
            'Диалог',
        ]
        const paramsWs = XLSX.utils.aoa_to_sheet([paramsTableTitle])
        paramsWs['!cols'] = this.fitColumnsByTitle(paramsTableTitle)
        paramsWs['!cols'][0] = { wch: 20 }

        const usersInfoContent: (string | number)[][] = []

        const cursor = this.userModel.find({}).lean().cursor({ batchSize: 1000 })

        for await (const user of cursor) {
            usersInfoContent.push([
                user.createdAt.formattedWithAppTimeZone('DD.MM.YYYY'),
                user.telegramId,
                user.isBotBlocked ? 'Да' : '',
                user.telegramUserIsDeactivated ? 'Да' : '',
                user.telegramInfo.username ?? '',
                user.startParam ? user.startParam.utm.join(', ') : '',
                UserProfile.Helper.getForumDialogLink(user.telegramTopic) ?? '',
            ])
        }

        XLSX.utils.sheet_add_aoa(paramsWs, usersInfoContent, { origin: 'A2' })
        return paramsWs
    }

    private fitColumnsByTitle(tableContent: (string | null)[]): object[] {
        // get maximum character of each column
        return tableContent.map((title) => ({
            wch: title
                ? Math.max.apply(
                      null,
                      title.split('\n').map((line) => line.length + 2)
                  )
                : 10,
        }))
    }

    private fitColumnsByData(tableContent: (string | number)[][]): { wch: number }[] {
        // get maximum character of each column
        return tableContent[0].map((a, i) => ({
            wch: Math.max(...tableContent.map((a2) => (a2[i] ? a2[i].toString().length + 2 : 10))),
        }))
    }
}

import { Injectable } from '@nestjs/common'
// import { google } from 'googleapis'
import { GoogleCredentialsService } from './google-credentials.service'
import { SpreadsheetPrototype } from './enums/spreadsheet-prototype'
import {
    replaceMarkdownWithHtml,
    validateStringHtmlTagsAll,
} from 'src/utils/replaceMarkdownWithHtml'
import { internalConstants } from 'src/app.internal-constants'
import { logger } from 'src/app.logger'
import * as XLSX from 'xlsx'

@Injectable()
export class GoogleTablesService {
    constructor(private readonly googleCredentialsService: GoogleCredentialsService) {}

    private readonly spreadsheetId = internalConstants.googleSpreadsheetId

    async getLanguagesFrom(page: SpreadsheetPrototype.SomePageLocalization): Promise<string[]> {
        const pageConfig = SpreadsheetPrototype.schemaLocalization[page]
        const cacheConfig = pageConfig.cacheConfiguration
        const content = await this.getContentByListName(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.configurationRow}`
        )
        const notLanguageKeys = Object.keys(pageConfig.itemPrototype)
        const result = content.first?.filter((title) => notLanguageKeys.includes(title) === false)
        return result ?? []
    }

    async getLocalizedStringsFrom<Page extends SpreadsheetPrototype.SomePageLocalization>(
        page: Page
    ): Promise<SpreadsheetPrototype.RowItemLocalization<Page>[]> {
        return this.getContentItemsFromPage(
            page
        ) as any as SpreadsheetPrototype.RowItemLocalization<Page>[]
    }

    async getContentFrom<Page extends SpreadsheetPrototype.SomePageContent>(
        page: Page
    ): Promise<SpreadsheetPrototype.RowItemContent<Page>[]> {
        return this.getContentItemsFromPage(
            page
        ) as any as SpreadsheetPrototype.RowItemContent<Page>[]
    }

    private async getContentItemsFromPage(
        page: SpreadsheetPrototype.SomePage
    ): Promise<Record<string, string | Record<string, string>>[]> {
        const pageConfig = SpreadsheetPrototype.getSchemaForPage(page)
        const cacheConfig = pageConfig.cacheConfiguration
        const validation = pageConfig.validation
        let content = await this.getContentByListName(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.lastContentRow}`
        )

        const configurationRow = content.first
        if (!configurationRow || configurationRow.isEmpty) {
            throw Error(
                `Sheet cache error: ${pageConfig.sheetId}. Configuration row identification failed!`
            )
        }
        Object.keys(pageConfig.itemPrototype).forEach((key) => {
            if (configurationRow.includes(key) === false)
                throw Error(
                    `Sheet cache error: ${pageConfig.sheetId}. Remote configuration row does not contains key "${key}"!`
                )
        })

        content = content
            .slice(cacheConfig.firstContentRow - cacheConfig.configurationRow)
            .filter((row) => row.length >= validation.minRowLength)

        if (content.isEmpty) {
            throw Error(`Sheet cache error: ${pageConfig.sheetId}. No content`)
        }
        const itemPrototypeKeys = Object.keys(pageConfig.itemPrototype)

        const result = this.rowsToStringRecords(configurationRow, content)
            .map((rowRecord) => {
                const rowItem: Record<string, string | Record<string, string>> = {}
                const localizedValues: Record<string, string> = {}
                for (const rowKey in rowRecord) {
                    if (itemPrototypeKeys.includes(rowKey)) {
                        rowItem[rowKey] = rowRecord[rowKey]
                    } else {
                        localizedValues[rowKey] = rowRecord[rowKey]
                    }
                }
                if (pageConfig.contentType == 'localizedStrings') {
                    rowItem['localizedValues'] = localizedValues
                }
                return rowItem
            })
            .filter((item) => {
                for (const requiredField in validation.requiredFields) {
                    const value = item[requiredField]
                    if (!value || value.isEmpty) return false
                }
                return true
            })

        return result
    }

    private rowsToStringRecords(
        configurationRow: string[],
        content: string[][]
    ): Record<string, string>[] {
        return content.map((row) => {
            const rowObject: Record<string, string> = {}
            configurationRow.forEach((key, index) => {
                rowObject[key] = row[index]
            })
            return rowObject
        })
    }

    private async getContentByListName(pageName: string, range: string): Promise<string[][]> {
        logger.log(`Start cache ${pageName}`)

        const workbook = XLSX.read('./ShinestBotOpenDataTable.xlsx', {
            type: 'file',
            sheet: pageName,
        })
        const worksheet = workbook.Sheets[pageName]
        const localRows: string[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: range,
            raw: false,
        })
        const rows = localRows.filter((row) => row.isNotEmpty)

        // const auth = await this.googleCredentialsService.authorize()
        // const sheets = google.sheets({ version: 'v4', auth: auth })
        // const res = await sheets.spreadsheets.values.get({
        //     spreadsheetId: this.spreadsheetId,
        //     range: `${pageName}!${range}`,
        // })
        // const rows = res.data.values
        // if (!rows || rows.length === 0) {
        //     logger.warn('No data found.')
        //     return []
        // }

        // Markdown telegram spec symbols fix
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let cellValue = rows[i][j]
                if (cellValue) {
                    cellValue = replaceMarkdownWithHtml(cellValue).trimmed
                    validateStringHtmlTagsAll(cellValue)
                    rows[i][j] = cellValue
                }
            }
        }
        return rows
    }
}

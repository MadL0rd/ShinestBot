import { Injectable } from '@nestjs/common'
import { SheetDataProviderFactoryService } from './sheet-data-provider-factory/sheet-data-provider-factory.service'
import { ISheetDataProvider } from './abscract/sheet-data-provider.interface'
import { DataSheetPrototype } from './schemas/data-sheet-prototype'
import { LanguageCode } from 'src/utils/languages-info/getLanguageName'

@Injectable()
export class SheetDataProviderService {
    // =====================
    // Properties
    // =====================

    private readonly sheetDataProvider: ISheetDataProvider
    constructor(private readonly dataProvidersFactory: SheetDataProviderFactoryService) {
        this.sheetDataProvider = this.dataProvidersFactory.getDefaultProvider()
    }

    // =====================
    // Public methods
    // =====================

    async getLanguagesFrom(
        page: DataSheetPrototype.SomePageLocalization
    ): Promise<LanguageCode.Union[]> {
        const pageConfig = DataSheetPrototype.schemaLocalization[page]
        const cacheConfig = pageConfig.cacheConfiguration
        const content = await this.sheetDataProvider.getContentByListName(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.configurationRow}`
        )
        const notLanguageKeys = Object.keys(pageConfig.itemPrototype)
        const languageCodes =
            content.first?.filter((title) => notLanguageKeys.includes(title) === false) ?? []
        const languageCodesStable = languageCodes.compactMap((code) =>
            LanguageCode.castToInstance(code)
        )
        return languageCodesStable ?? []
    }

    async getLocalizedStringsFrom<Page extends DataSheetPrototype.SomePageLocalization>(
        page: Page
    ): Promise<DataSheetPrototype.RowItemLocalization<Page>[]> {
        return this.getContentItemsFromPage(
            page
        ) as any as DataSheetPrototype.RowItemLocalization<Page>[]
    }

    async getContentFrom<Page extends DataSheetPrototype.SomePageContent>(
        page: Page
    ): Promise<DataSheetPrototype.RowItemContent<Page>[]> {
        return this.getContentItemsFromPage(
            page
        ) as any as DataSheetPrototype.RowItemContent<Page>[]
    }

    // =====================
    // Private methods
    // =====================

    private async getContentItemsFromPage(
        page: DataSheetPrototype.SomePage
    ): Promise<Record<string, string | Record<string, string>>[]> {
        const pageConfig = DataSheetPrototype.getSchemaForPage(page)
        const cacheConfig = pageConfig.cacheConfiguration
        const validation = pageConfig.validation
        let content = await this.sheetDataProvider.getContentByListName(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.lastContentRow}`
        )

        const configurationRow = content.first
        if (!configurationRow || configurationRow.isEmpty) {
            throw Error(
                `Sheet cache error: ${pageConfig.sheetId}. Configuration row identification failed!`
            )
        }
        const itemPrototypeKeys = Object.keys(pageConfig.itemPrototype)
        itemPrototypeKeys.forEach((key) => {
            if (configurationRow.includes(key) === false)
                throw Error(
                    `Sheet cache error: ${pageConfig.sheetId}. Remote configuration row does not contains key "${key}"!`
                )
        })
        const configurationRowLanguages = configurationRow.filter(
            (rowKey) =>
                itemPrototypeKeys.includes(rowKey) == false &&
                LanguageCode.allCases.includes(rowKey)
        )

        content = content
            .slice(cacheConfig.firstContentRow - cacheConfig.configurationRow)
            .filter((row) => row.length >= validation.minRowLength)

        if (content.isEmpty) {
            throw Error(`Sheet cache error: ${pageConfig.sheetId}. No content`)
        }

        const result = this.rowsToStringRecords(configurationRow, content).map((rowRecord) => {
            const rowItem: Record<string, string | Record<string, string>> = {}
            const localizedValues: Record<string, string> = {}
            for (const rowKey in rowRecord) {
                if (!rowRecord[rowKey] || rowRecord[rowKey].isEmpty) continue

                if (itemPrototypeKeys.includes(rowKey)) {
                    rowItem[rowKey] = rowRecord[rowKey]
                } else if (configurationRowLanguages.includes(rowKey)) {
                    localizedValues[rowKey] = rowRecord[rowKey]
                }
            }
            if (pageConfig.contentType == 'localizedStrings') {
                const itemLanguages = Object.keys(localizedValues)
                if (configurationRowLanguages.length != itemLanguages.length) {
                    const rowItemJson = JSON.stringify(rowRecord, null, 2)
                    throw Error(
                        `Sheet cache error: ${pageConfig.sheetId}\nRow item miss some languages\n${rowItemJson}`
                    )
                }
                rowItem['localizedValues'] = localizedValues
            }

            for (const requiredField in validation.requiredFields) {
                const value = rowItem[requiredField]
                if (!value || value.isEmpty) {
                    const rowItemJson = JSON.stringify(rowRecord)
                    throw Error(
                        `Sheet cache error: ${pageConfig.sheetId}\nRow item miss required field '${requiredField}'\n${rowItemJson}`
                    )
                }
            }
            return rowItem
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
}

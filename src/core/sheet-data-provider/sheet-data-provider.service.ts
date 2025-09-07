import { Injectable } from '@nestjs/common'
import { LanguageCode } from 'src/utils/languages-info/getLanguageName'
import {
    replaceMarkdownWithHtml,
    validateStringHtmlTagsAll,
} from 'src/utils/replace-markdown-with-html'
import z, { ZodError } from 'zod'
import { ISheetDataProvider } from './abstract/sheet-data-provider.interface'
import { SourceRowData, SourceRowDataObject } from './abstract/source-row-data'
import { DataSheetPrototype } from './schemas/data-sheet-prototype'
import { zSheet } from './schemas/z-sheet-data-util-schemas'
import { SheetDataProviderFactoryService } from './sheet-data-provider-factory/sheet-data-provider-factory.service'

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
        const content = await this.sheetDataProvider.getContentFromPage(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.configurationRow}`
        )
        const notLanguageKeys = Object.keys(pageConfig.itemSchema)
        const languageCodes =
            content.first?.filter((title) => notLanguageKeys.includes(title) === false) ?? []
        const languageCodesStable = languageCodes.compactMap((code) =>
            LanguageCode.castToInstance(code)
        )
        return languageCodesStable ?? []
    }

    async getLocalizedStringsFrom<Page extends DataSheetPrototype.SomePageLocalization>(
        page: Page,
        addMetadata: boolean = false
    ): Promise<DataSheetPrototype.RowItemLocalization<Page>[]> {
        return this.getContentItemsFromPage({
            page,
            addMetadata,
        }) as any as DataSheetPrototype.RowItemLocalization<Page>[]
    }

    async getContentFrom<Page extends DataSheetPrototype.SomePageContent>(
        page: Page,
        addMetadata: boolean = false
    ): Promise<DataSheetPrototype.RowItemContent<Page>[]> {
        return this.getContentItemsFromPage({
            page,
            addMetadata,
        }) as any as DataSheetPrototype.RowItemContent<Page>[]
    }

    // =====================
    // Private methods
    // =====================

    private async getContentItemsFromPage(args: {
        page: DataSheetPrototype.SomePage
        addMetadata: boolean
    }): Promise<Record<string, any>[]> {
        const { page, addMetadata } = args

        const pageConfig = DataSheetPrototype.getSchemaForPage(page)
        const cacheConfig = pageConfig.cacheConfiguration
        const content = await this.sheetDataProvider.getContentFromPage(
            pageConfig.sheetPublicName,
            `${cacheConfig.firstLetter}${cacheConfig.configurationRow}:${cacheConfig.lastLetter}${cacheConfig.lastContentRow}`
        )

        const configurationRow = content.first
        if (!configurationRow || configurationRow.isEmpty) {
            throw Error(
                `Sheet cache error: ${pageConfig.sheetId}. Configuration row identification failed!`
            )
        }

        const contentRows: SourceRowData[] = content
            .slice(cacheConfig.firstContentRow - cacheConfig.configurationRow)
            .map((row, index) => {
                return {
                    rowIndex: index + cacheConfig.firstContentRow,
                    content: row,
                }
            })
            .filter((row) => row.content.length >= cacheConfig.minRowLength)

        if (contentRows.isEmpty) {
            return []
        }

        let configurationRowLanguagesSchema: z.ZodObject<any> | null = null
        if (pageConfig.contentType === 'localizedStrings') {
            configurationRowLanguagesSchema = z.object(
                configurationRow
                    .filter((rowKey) => LanguageCode.includes(rowKey))
                    .reduce((acc, language) => {
                        Object.assign(acc, { [language]: zSheet.string.required })
                        return acc
                    }, {})
            )
        }

        const result = this.rowsToStringRecords(configurationRow, contentRows).map((rowObject) => {
            const itemParseResult = pageConfig.itemSchema.safeParse(rowObject.content)

            if (itemParseResult.success === false || !itemParseResult.data) {
                throw Error(
                    [
                        `Fail to parse item ${JSON.stringify(rowObject)}`,
                        itemParseResult.error instanceof ZodError
                            ? z.prettifyError(itemParseResult.error)
                            : `Validation error: ${JSON.stringify(itemParseResult.error)}`,
                    ].join('\n')
                )
            }

            if (addMetadata) {
                Object.assign(itemParseResult.data, { sourceRowIndex: rowObject.rowIndex })
            }

            if (configurationRowLanguagesSchema) {
                const localizedValuesParseResult = configurationRowLanguagesSchema.safeParse(
                    rowObject.content
                )
                if (localizedValuesParseResult.success === false) {
                    throw Error(
                        [
                            `Fail to parse item localization ${JSON.stringify(rowObject)}`,
                            localizedValuesParseResult.error instanceof ZodError
                                ? z.prettifyError(localizedValuesParseResult.error)
                                : `Validation error: ${JSON.stringify(localizedValuesParseResult.error)}`,
                        ].join('\n')
                    )
                }
                Object.assign(itemParseResult.data, {
                    localizedValues: localizedValuesParseResult.data,
                })
            }
            return itemParseResult.data
        })

        return result
    }

    private rowsToStringRecords(
        configurationRow: string[],
        rows: SourceRowData[]
    ): SourceRowDataObject[] {
        return rows.map((row) => {
            const rowObject: Record<string, string> = {}
            configurationRow.forEach((key, index) => {
                let content = row.content[index]
                if (content) {
                    content = replaceMarkdownWithHtml(content).trim()
                    validateStringHtmlTagsAll(content)
                }
                rowObject[key] = content
            })
            return {
                rowIndex: row.rowIndex,
                content: rowObject,
            }
        })
    }
}

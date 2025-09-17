import z from 'zod'
import { DataSheetPageSchema } from './data-sheet-page-schema.interface'
import { spreadsheetSchema } from './spreadsheet.schema'

export namespace DataSheetPrototype {
    // Content schemas
    export const schemaLocalization = spreadsheetSchema.localizedStrings
    export const schemaContent = spreadsheetSchema.commonContent
    export type PageContentTypes = 'localizedStrings' | 'commonContent'

    export function getSchemaForPage(page: SomePage): DataSheetPageSchema {
        if (Object.keys(schemaLocalization).includes(page)) {
            return schemaLocalization[page as SomePageLocalization] as DataSheetPageSchema
        }
        return schemaContent[page as SomePageContent] as DataSheetPageSchema
    }

    // Spreadsheet page types
    export type SomePageLocalization = keyof typeof schemaLocalization
    export type SomePageContent = keyof typeof schemaContent
    export type SomePage = SomePageLocalization | SomePageContent

    export const allPagesLocalization = Object.keys(schemaLocalization) as SomePageLocalization[]
    export const allPagesContent = Object.keys(schemaContent) as SomePageContent[]
    export const allPages = [...allPagesLocalization, ...allPagesContent] as SomePage[]

    // Spreadsheet page row items
    export type RowItemLocalization<Page extends SomePageLocalization> = z.infer<
        (typeof schemaLocalization)[Page]['itemSchema']
    > & {
        localizedValues: Record<string, string>
    }
    export type RowItemContent<Page extends SomePageContent> = z.infer<
        (typeof schemaContent)[Page]['itemSchema']
    >
}

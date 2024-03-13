import * as spreadsheetSchema from './SpreadsheetSchema.json'
import { DataSheetPageSchema } from './data-sheet-page-schema.interface'

type RowPrototype<BasePrototype, RequiredFields extends keyof any> = {
    [Prop in keyof BasePrototype]: Prop extends RequiredFields
        ? BasePrototype[Prop]
        : BasePrototype[Prop] | undefined
}

export namespace DataSheetPrototype {
    // Content schemas
    export const schemaLocalization = spreadsheetSchema.localizedStrings
    export const schemaContent = spreadsheetSchema.commonContent
    export type PageContentTypes = keyof typeof spreadsheetSchema

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
    export type RowItemLocalization<Page extends SomePageLocalization> = RowPrototype<
        (typeof schemaLocalization)[Page]['itemPrototype'] & {
            localizedValues: Record<string, string>
        },
        keyof (typeof schemaLocalization)[Page]['validation']['requiredFields'] | 'localizedValues'
    >
    export type RowItemContent<Page extends SomePageContent> = RowPrototype<
        (typeof schemaContent)[Page]['itemPrototype'],
        keyof (typeof schemaContent)[Page]['validation']['requiredFields']
    >
}

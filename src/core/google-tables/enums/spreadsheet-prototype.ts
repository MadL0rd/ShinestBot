import * as spreadsheetSchema from './SpreadsheetSchema.json'

type RowPrototype<BasePrototype, RequiredFields extends keyof any> = {
    [Prop in keyof BasePrototype]: Prop extends RequiredFields
        ? BasePrototype[Prop]
        : BasePrototype[Prop] | undefined
}

export namespace SpreadsheetPrototype {
    // Content schemas
    export const schemaLocalization = spreadsheetSchema.localizedStrings
    export const schemaContent = spreadsheetSchema.commonContent
    export type PageContentTypes = keyof typeof spreadsheetSchema

    export function getSchemaForPage(page: SomePage): SheetPageSchema {
        if (Object.keys(schemaLocalization).includes(page)) {
            return schemaLocalization[page as SomePageLocalization] as SheetPageSchema
        }
        return schemaContent[page as SomePageContent] as SheetPageSchema
    }

    // Spreadsheet page types
    export type SomePageLocalization = keyof typeof schemaLocalization
    export type SomePageContent = keyof typeof schemaContent
    export type SomePage = SomePageLocalization | SomePageContent

    export const allPages = [
        ...Object.keys(schemaContent).filter(
            (key) => typeof schemaLocalization[key as SomePageLocalization] === 'string'
        ),
        ...Object.keys(schemaContent).filter(
            (key) => typeof schemaContent[key as SomePageContent] === 'string'
        ),
    ] as SomePage[]

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

interface SheetPageSchema {
    sheetId: string
    sheetPublicName: string
    contentType: 'common' | 'localizedStrings'
    cacheConfiguration: {
        configurationRow: number
        firstContentRow: number
        lastContentRow: number
        firstLetter: string
        lastLetter: string
    }
    validation: {
        minRowLength: number
        requiredFields: Record<string, string>
    }
    itemPrototype: Record<string, string>
}

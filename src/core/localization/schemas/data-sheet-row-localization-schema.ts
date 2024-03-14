import { DataSheetPrototype } from 'src/core/sheet-data-provider/schemas/data-sheet-prototype'

export type DataSheetRowLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> =
    | IdentifiableRowLocalizationSchema<Page>
    | UnidentifiableRowLocalizationSchema<Page>

type IdentifiableRowLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> = {
    readonly type: 'identifiable'
    readonly page: Page
    readonly group: string
    readonly itemIdField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly localizationSchema: IdentifiableRowFieldsLocalizationSchema<Page>
}

type UnidentifiableRowLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> = {
    readonly type: 'unidentifiable'
    readonly page: Page
    readonly groupField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly keyField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly localizationSchema: UnidentifiableRowFieldsLocalizationSchema<Page>
}

type IdentifiableRowFieldsLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> = {
    readonly [Prop in keyof DataSheetPrototype.RowItemContent<Page>]: RowFieldTypeIdentifiable
}

type UnidentifiableRowFieldsLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> = {
    readonly [Prop in keyof DataSheetPrototype.RowItemContent<Page>]: RowFieldTypeUnidentifiable
}

type RowFieldTypeIdentifiable =
    | RowFieldOriginalContent
    | RowFieldIdentifiableBase
    | RowFieldIdentifiableArray
type RowFieldTypeUnidentifiable = RowFieldOriginalContent | RowFieldUnidentifiable

type RowFieldOriginalContent = {
    /**
     * Use original field value from DataSheetPrototype.RowItemContent
     * */
    readonly type: 'originalContent'
}

type RowFieldUnidentifiable = {
    /**
     * Localized field with key format for localized string `${fieldName}`
     * */
    readonly type: 'unidentifiable'
}

type RowFieldIdentifiableBase = {
    /**
     * Localized field with key format for localized string `${itemId} / ${fieldName}`
     * */
    readonly type: 'identifiableBase'
}

type RowFieldIdentifiableArray = {
    /**
     * Localized field with key format for localized string `${itemId} / ${fieldName} / ${arrayItemId}`
     * */
    readonly type: 'identifiableArray'
    readonly arrayItemsSeparator: '\n'
    readonly arrayItemComponentsSeparator: '/'
    readonly arrayItemIdIndex: 0
}

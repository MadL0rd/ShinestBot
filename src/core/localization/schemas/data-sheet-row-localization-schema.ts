import { DataSheetPrototype } from 'src/core/sheet-data-provider/schemas/data-sheet-prototype'

export type DataSheetRowLocalizationSchema<Page extends DataSheetPrototype.SomePageContent> =
    | RowLocalizationSchemaIdentifiable<Page>
    | RowLocalizationSchemaByGroupAndKey<Page>

type RowLocalizationSchemaIdentifiable<Page extends DataSheetPrototype.SomePageContent> = {
    readonly type: 'byItemId'
    readonly page: Page
    readonly group: string
    readonly itemIdField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly localizationSchema: RowFieldsLocalizationSchemaIdentifiable<Page>
}

type RowLocalizationSchemaByGroupAndKey<Page extends DataSheetPrototype.SomePageContent> = {
    readonly type: 'byItemGroupAndKey'
    readonly page: Page
    readonly groupField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly keyField: keyof DataSheetPrototype.RowItemContent<Page>
    readonly localizationSchema: RowFieldsLocalizationSchemaGroupAndKeyOnly<Page>
}

type RowFieldsLocalizationSchemaIdentifiable<Page extends DataSheetPrototype.SomePageContent> = {
    readonly [Prop in keyof DataSheetPrototype.RowItemContent<Page>]: RowFieldTypeIdentifiable
}

type RowFieldsLocalizationSchemaGroupAndKeyOnly<Page extends DataSheetPrototype.SomePageContent> = {
    readonly [Prop in keyof DataSheetPrototype.RowItemContent<Page>]: RowFieldTypeGroupAndKeyOnly
}

type RowFieldTypeIdentifiable =
    | RowFieldOriginalContent
    | RowFieldIdentifiableBase
    | RowFieldIdentifiableArray
type RowFieldTypeGroupAndKeyOnly = RowFieldOriginalContent | RowFieldByItemGroupAndKey

type RowFieldOriginalContent = {
    /**
     * Use original field value from DataSheetPrototype.RowItemContent
     * */
    readonly type: 'originalContent'
}

type RowFieldByItemGroupAndKey = {
    /**
     * Localized field with key format for localized string `${fieldName}`
     * */
    readonly type: 'byItemGroupAndKey'
}

type RowFieldIdentifiableBase = {
    /**
     * Localized field with key format for localized string `${itemId} / ${fieldName}`
     * */
    readonly type: 'byIdAndFieldName'
}

type RowFieldIdentifiableArray = {
    /**
     * Localized field with key format for localized string `${itemId} / ${fieldName} / ${arrayItemId}`
     * */
    readonly type: 'byIdAndFieldNameForArray'
    readonly itemsSeparator: '\n'
    readonly itemComponentsSeparator: '/'
    readonly itemIdIndex: 0
    readonly needToBeLocalizedPrefix: '$'
}

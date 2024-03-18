import { DataSheetPrototype } from './data-sheet-prototype'

export interface DataSheetPageSchema {
    sheetId: string
    sheetPublicName: string
    contentType: DataSheetPrototype.PageContentTypes
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

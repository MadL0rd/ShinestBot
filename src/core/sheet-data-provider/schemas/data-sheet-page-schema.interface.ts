import z from 'zod'
import { DataSheetPrototype } from './data-sheet-prototype'

export type DataSheetRowFieldType = 'string' | 'boolean'

export type DataSheetPageSchemaBase = {
    cacheConfiguration: {
        configurationRow: number
        firstContentRow: number
        lastContentRow: number
        firstLetter: string
        lastLetter: string
        minRowLength: number
    }
    itemSchema: z.Schema
}

export type DataSheetPageSchema = DataSheetPageSchemaBase & {
    sheetId: string
    sheetPublicName: string
    contentType: DataSheetPrototype.PageContentTypes
}

import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const uniqueMessages = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 1000,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 2,
    },
    itemSchema: z.object({
        group: zSheet.string.required,
        key: zSheet.string.required,
        comment: zSheet.string.optional,
        params: zSheet.string.optional,
        isUniqueMessage: zSheet.boolean.required,
        defaultValue: zSheet.string.required,
        defaultValueLanguage: zSheet.string.required,
    }),
} as const satisfies DataSheetPageSchemaBase

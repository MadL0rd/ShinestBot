import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const redirectLinks = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 2,
    },
    itemSchema: z.object({
        id: zSheet.string.required,
        source: zSheet.string.required,
    }),
} as const satisfies DataSheetPageSchemaBase

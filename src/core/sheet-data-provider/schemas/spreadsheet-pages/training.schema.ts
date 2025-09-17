import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const training = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 2,
    },
    itemSchema: z
        .object({
            id: zSheet.string.required,
            type: zSheet.string.required,
            title: zSheet.string.required,
            text: zSheet.string.optional,
            disableWebPagePreview: zSheet.boolean.required,
            ...zSheet.mediaProps,
        })
        .transform(zSheet.transform.extractMedia),
} as const satisfies DataSheetPageSchemaBase

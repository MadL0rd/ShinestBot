import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const onboardingPages = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 3,
    },
    itemSchema: z
        .object({
            id: zSheet.string.required,
            groupId: zSheet.string.required,
            messageText: zSheet.string.optional,
            buttonText: zSheet.string.optional,
            disableWebPagePreview: zSheet.boolean.required,
            ...zSheet.mediaProps,
        })
        .transform(zSheet.transform.extractMedia),
} as const satisfies DataSheetPageSchemaBase

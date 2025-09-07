import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const onboardingGroups = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 3,
    },
    itemSchema: z.object({
        groupId: zSheet.string.required,
        type: zSheet.string.required,
        priority: zSheet.string.required,
        utm: zSheet.string.optional,
    }),
} as const satisfies DataSheetPageSchemaBase

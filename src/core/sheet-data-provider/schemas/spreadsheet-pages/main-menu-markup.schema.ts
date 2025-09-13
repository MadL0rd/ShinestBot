import { BotContent } from 'src/entities/bot-content'
import { checkTypeExtends } from 'src/utils/check-type-extends'
import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

export const mainMenuMarkup = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 6,
    },
    itemSchema: z
        .object({
            id: zSheet.string.required,
            hideInlineKeyboardOnTap: zSheet.boolean.required,
            buttonText: zSheet.string.required,
            appTagFilter: zSheet.appTagFilter,
            chatMembersFilter: z
                .string()
                .optional()
                .transform((valuesString) => valuesString?.split('\n').compact ?? [])
                .pipe(
                    z
                        .string()
                        .refine(
                            (value) => /^-100\d{1,20}$/.test(`${value}`),
                            'Monitored telegram chatId should be valid int64 and starts with -100'
                        )
                        .pipe(z.coerce.number())
                        .array()
                ),
        })
        .and(
            z
                .union([
                    z.object({
                        inlineModeOnly: zSheet.boolean.true,
                    }),
                    z.object({
                        inlineModeOnly: zSheet.boolean.false,
                        rowNumber: zSheet.number.int.required,
                    }),
                ])
                .transform((data) => ({
                    displayMode: (data.inlineModeOnly
                        ? { type: 'inlineOnly' }
                        : {
                              type: 'default',
                              rowNumber: data.rowNumber,
                          }) as BotContent.MainMenuButton.DisplayMode,
                }))
        )
        .and(
            z.union([
                z.object({
                    actionType: z.enum(['training', 'survey', 'none']),
                }),

                z
                    .object({
                        actionType: z.enum(['sendContent']),
                        disableWebPagePreview: zSheet.boolean.required,
                        messageText: zSheet.string.optional,
                        ...zSheet.mediaProps,
                    })
                    .check(zSheet.check.existsMediaOrAtLeastOneOf(['messageText']))
                    .transform(zSheet.transform.extractMedia),
            ])
        ),
} as const satisfies DataSheetPageSchemaBase

checkTypeExtends<z.infer<typeof mainMenuMarkup.itemSchema>, BotContent.MainMenuButton.BaseType>()

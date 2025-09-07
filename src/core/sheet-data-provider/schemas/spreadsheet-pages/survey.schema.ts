import { Survey } from 'src/entities/survey'
import { checkTypeExtends } from 'src/utils/check-type-extends'
import { swapFn } from 'src/utils/swap-fn'
import z from 'zod'
import { DataSheetPageSchemaBase } from '../data-sheet-page-schema.interface'
import { zSheet } from '../z-sheet-data-util-schemas'

const answerOptionSchema = z.object({
    id: z.string().nonempty(),
    text: z.string().nonempty(),
})

export const survey = {
    cacheConfiguration: {
        configurationRow: 1,
        firstContentRow: 3,
        lastContentRow: 100,
        firstLetter: 'A',
        lastLetter: 'Z',
        minRowLength: 3,
    },
    itemSchema: z.preprocess(
        preprocessData,
        z
            .object({
                id: zSheet.string.required,
                appTagFilter: zSheet.appTagFilter,
                isRequired: zSheet.boolean.required,
                showInTheLastStep: zSheet.boolean.required,
                questionText: zSheet.string.required,
                serviceMessageNavigationText: zSheet.string.required,
                publicTitle: zSheet.string.required,
                filters: z
                    .object({
                        type: z.enum(['showIf', 'removeIf']),
                        targetQuestionId: z.string().nonempty(),
                        validOptionIds: z.string().nonempty().array(),
                    })
                    .array(),
                addAnswerToTelegramPublication: zSheet.boolean.optional.transform(() => true),
                ...zSheet.mediaProps,
            })
            .transform(zSheet.transform.extractMedia)
            .and(
                z.discriminatedUnion('type', [
                    z.object({
                        type: z.enum(['options', 'optionsInline']),
                        options: answerOptionSchema.array().nonempty(),
                        useIdAsPublicationTag: z.boolean(),
                        boolConvertibleAnswers: z.boolean(),
                    }),
                    z.object({
                        type: z.literal('multipleChoice'),
                        options: answerOptionSchema.array().nonempty(),
                        useIdAsPublicationTag: z.boolean(),
                        minCount: zSheet.number.int.required.check(z.positive()),
                        maxCount: zSheet.number.int.required.check(z.positive()),
                    }),
                    z.object({
                        type: z.literal('numeric'),
                        unit: z.string().nonempty().optional(),
                    }),
                    z.object({
                        type: z.literal('string'),
                    }),
                    z.object({
                        type: z.literal('stringGptTips'),
                    }),
                    z.object({
                        type: z.literal('image'),
                        maxCount: zSheet.number.int.required.check(z.positive()),
                    }),
                    z.object({
                        type: z.literal('singleImage'),
                        maxCount: z
                            .literal('1')
                            .optional()
                            .transform(() => 1 as const),
                        serviceMessageFilledText: z.string().trim().optional(),
                    }),
                    z.object({
                        type: z.literal('video'),
                        maxCount: zSheet.number.int.required.check(z.positive()),
                    }),
                    z.object({
                        type: z.literal('mediaGroup'),
                        maxCount: zSheet.number.int.required.check(z.positive()),
                    }),
                    z.object({
                        type: z.literal('phoneNumber'),
                    }),
                ])
            )
    ),
} as const satisfies DataSheetPageSchemaBase

export type SchemaItemsType = z.infer<typeof survey.itemSchema>
checkTypeExtends<SchemaItemsType, Survey.Question>()

const publicNamesMap = swapFn({
    // Answer types
    options: 'Выбор варианта',
    optionsInline: 'Выбор варианта инлайн кнопками',
    multipleChoice: 'Множественный выбор',
    numeric: 'Число',
    string: 'Строка',
    stringGptTips: 'Строка + GPT',
    image: 'Изображение',
    singleImage: 'Одиночное изображение',
    video: 'Видео',
    mediaGroup: 'Медиа группа',
    phoneNumber: 'Номер телефона',

    // Filter types
    showIf: 'ПоказатьЕсли',
    removeIf: 'СброситьЕсли',
})

function preprocessData(data: Record<string, unknown>) {
    if ('answerType' in data && typeof data['answerType'] === 'string') {
        data.type =
            publicNamesMap[data.answerType as keyof typeof publicNamesMap] ?? data.answerType
    }

    const paramsData = (typeof data['answerParams'] === 'string' ? data.answerParams : '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .reduce(
            (acc, item) => {
                const [id, value] = item.split('/').map((itemPart) => itemPart.trim())

                switch (id) {
                    case 'useIdAsPublicationTag':
                        acc[id] = true
                        break

                    case 'boolConvertible':
                        acc.boolConvertibleAnswers = true
                        break

                    case 'minCount':
                    case 'maxCount':
                    case 'unit':
                        acc[id] = value
                        break

                    default:
                        acc.options.push({
                            id,
                            text: value,
                        })
                }

                return acc
            },
            {
                useIdAsPublicationTag: false,
                boolConvertibleAnswers: false,
                minCount: undefined as string | undefined,
                maxCount: undefined as string | undefined,
                unit: undefined as string | undefined,
                options: [] as Survey.AnswerOption[],
            }
        )
    Object.assign(data, paramsData)

    if ('filters' in data && typeof data['filters'] === 'string') {
        data.filters = data.filters
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((filterLine) => {
                const [type, targetQuestionId, validOptionIdsString] = filterLine
                    .split('/')
                    .map((option: string) => option.trim())
                    .filter(Boolean)

                return {
                    type: type
                        ? (publicNamesMap[type as keyof typeof publicNamesMap] ?? type)
                        : undefined,
                    targetQuestionId,
                    validOptionIds: validOptionIdsString?.split('|').map((value) => value.trim()),
                }
            })
    } else {
        data.filters = []
    }

    return data
}

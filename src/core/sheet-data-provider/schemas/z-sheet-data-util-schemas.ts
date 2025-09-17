import { MediaContent } from 'src/entities/common/media-content.entity'
import { pickFields } from 'src/utils/pick-fields'
import { zTips } from 'src/utils/z-tips'
import z from 'zod'

export namespace zSheet {
    export const boolean = {
        true: z.literal('TRUE').transform(() => true as const),
        false: z.literal('FALSE').transform(() => false as const),
        required: z.enum(['TRUE', 'FALSE']).transform((value) => value === 'TRUE'),
        optional: z
            .enum(['TRUE', 'FALSE'])
            .transform((value) => value === 'TRUE')
            .optional(),
    } as const

    export const string = {
        required: z.string().trim().min(1),
        optional: z.string().trim().optional(),
    } as const

    export const appTagFilter = z
        .enum(['dev', 'prod', '', 'all'])
        .optional()
        .transform((value) => (value ? value : 'all'))

    export const number = zTips.numberFromString

    export const enumeration = zTips.enumMapped

    const mediaStringSchema = string.optional.transform((value) =>
        value
            ? value
                  ?.split('\n')
                  .map((url) => url.trim())
                  .filter((url) => url.length > 0)
            : []
    )
    const mediaKeys = [
        'video',
        'photo',
        'audio',
        'document',
        'animation',
        'voice',
        'videoNote',
        'sticker',
    ] as const
    type MediaKey = (typeof mediaKeys)[number]
    export const mediaProps = mediaKeys.reduce((acc, mediaFieldName) => {
        Object.assign(acc, { [mediaFieldName]: mediaStringSchema })
        return acc
    }, {}) as Record<MediaKey, typeof mediaStringSchema>
    export const media = z.object(mediaProps)

    export const transform = {
        extractMedia: <MediaRawType extends MediaContent>(
            dataRaw: MediaRawType
        ): Omit<MediaRawType, MediaKey> & { media: MediaContent } => {
            const ownKeys = Object.keys(dataRaw).filter(
                (key) => mediaKeys.includes(key) === false
            ) as Exclude<keyof MediaRawType, MediaKey>[]

            return {
                ...pickFields(dataRaw, ownKeys),
                media: pickFields(dataRaw, mediaKeys),
            }
        },

        rename: <OriginalValue extends string, MappedValue extends string>(
            keys: Record<OriginalValue, MappedValue>
        ) => {
            return (originalValue: OriginalValue) => keys[originalValue]
        },
    } as const

    export namespace check {
        export function existsAtLeastOneOf<T extends Record<string, unknown>>(
            keys: (keyof T)[]
        ): z.core.CheckFn<T> {
            return (ctx) => {
                const existsOneOkPropValues = Object.values(pickFields(ctx.value, keys)).reduce(
                    (acc, item) => {
                        return acc || item
                    },
                    true
                )
                if (existsOneOkPropValues) return
                ctx.issues.push({
                    code: 'custom',
                    message: `Item should contains one of ${keys.join(', ')}`,
                    path: [],
                    fatal: true,
                    input: ctx.value,
                })
            }
        }

        export function existsMediaOrAtLeastOneOf<T extends Record<string, unknown> & MediaContent>(
            keys: (keyof T)[]
        ): z.core.CheckFn<T> {
            return existsAtLeastOneOf([...keys, ...mediaKeys])
        }
    }
}

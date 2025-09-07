import 'dotenv/config'
import { replacerWithPath } from 'src/core/network-configurator/utils/replacer-with-path'
import { Prettify } from 'src/entities/common/prettify.type'
import { UnionToIntersection } from 'src/entities/common/union-to-intersection.type'
import { inspect } from 'util'
import z, { RefinementCtx } from 'zod'

function extractObjectFromBase64String(data: unknown, ctx: RefinementCtx) {
    try {
        if (typeof data !== 'string') return data
        const jsonString = Buffer.from(data, 'base64').toString('binary')
        return JSON.parse(jsonString ?? '')
    } catch (error) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON', error })
        return data
    }
}

const envSchemas = [
    z
        .object({
            MONGODB_ADDRESS: z.string(),
            MONGODB_DATABASE: z.string(),
            MONGODB_USER: z.string(),
            MONGODB_PASSWORD: z.string(),
        })
        .transform((env) => ({
            mongodb: {
                address: env.MONGODB_ADDRESS,
                database: env.MONGODB_DATABASE,
                user: env.MONGODB_USER,
                password: env.MONGODB_PASSWORD,
            },
        })),
    z
        .object({
            APP_IS_WEBHOOK_ACTIVE: z.stringbool(),
            APP_WEBHOOK_DOMAIN: z.string(),
            APP_API_DOMAIN: z.string(),
            APP_API_AUTH_TOKEN: z.string(),
            APP_EXPOSE_PORT: z.coerce.number(),
            APP_EXPOSE_PORT_WEBHOOK: z.coerce.number(),
            APP_EXPOSE_PORT_WEBHOOK_SERVICE_BOT: z.coerce.number(),
            APP_ENABLE_INTERNAL_CORS: z.stringbool(),
        })
        .transform((env) => ({
            webhookAndPorts: {
                isWebhookActive: env.APP_IS_WEBHOOK_ACTIVE,
                webhookDomain: env.APP_WEBHOOK_DOMAIN,
                apiDomain: env.APP_API_DOMAIN,
                apiAuthToken: env.APP_API_AUTH_TOKEN,
                exposePort: env.APP_EXPOSE_PORT,
                exposePortWebhook: env.APP_EXPOSE_PORT_WEBHOOK,
                enableInternalCors: env.APP_ENABLE_INTERNAL_CORS,
            },
        })),
    z
        .object({
            BOT_TOKEN: z.string(),
        })
        .transform((env) => ({
            botTokens: {
                mainBot: env.BOT_TOKEN,
            },
        })),
    z
        .object({
            FILE_STORAGE_CHAT_ID: z.coerce.number(),
            ERRORS_CHAT_ID: z.coerce.number().or(z.literal('null').transform(() => null)),
            ERRORS_CHAT_THREAD_ID: z.coerce.number().optional(),
            MODERATION_FORUM_DEFAULT_ID: z.coerce.number(),
            MODERATION_FORUM_LEGACY_IDS: z
                .string()
                .optional()
                .transform((ids) => ids?.split(',').map((id) => Number(id.trim())) ?? [])
                .pipe(z.number().array()),
        })
        .transform((env) => ({
            chatIds: {
                fileStorageChatId: env.FILE_STORAGE_CHAT_ID,
                errorsLogging: {
                    chatId: env.ERRORS_CHAT_ID,
                    threadId: env.ERRORS_CHAT_THREAD_ID,
                },
                moderationForums: {
                    legacyIds: env.MODERATION_FORUM_LEGACY_IDS,
                    default: env.MODERATION_FORUM_DEFAULT_ID,
                },
            },
        })),
    z
        .object({
            TZ: z.string(),
            APP_TZ: z.coerce.number(),
            npm_package_version: z.string().optional(),
            PROJECT_VERSION: z.string().optional(),
            BOT_TAG: z
                .enum(['dev', 'latest'])
                .optional()
                .default('dev')
                .transform((tag) => (({ dev: 'dev', latest: 'prod' }) as const)[tag]),
        })
        .transform((env) => ({
            app: {
                timeZone: env.TZ,
                timeZoneUtcOffset: env.APP_TZ,
                tag: env.BOT_TAG,
                projectVersion: env.PROJECT_VERSION ?? env.npm_package_version ?? null,
            },
        })),
    z
        .object({
            GOOGLE_SPREADSHEET_ID: z.string(),
            GOOGLE_SPREADSHEET_SERVICE_ACCOUNT_CREDENTIALS: z.preprocess(
                extractObjectFromBase64String,
                z.object({
                    type: z.string(),
                    project_id: z.string(),
                    private_key_id: z.string(),
                    private_key: z.string(),
                    client_email: z.string(),
                    client_id: z.string(),
                    auth_uri: z.string(),
                    token_uri: z.string(),
                    auth_provider_x509_cert_url: z.string(),
                    client_x509_cert_url: z.string(),
                    universe_domain: z.string(),
                })
            ),
            CACHE_BOT_CONTENT_ON_START: z.stringbool(),
        })
        .transform((env) => ({
            sheetContent: {
                defaultLanguage: 'RU' as const,
                cacheBotContentOnStart: env.CACHE_BOT_CONTENT_ON_START,
                googleSpreadsheetId: env.GOOGLE_SPREADSHEET_ID,
                credentials: env.GOOGLE_SPREADSHEET_SERVICE_ACCOUNT_CREDENTIALS,
            },
        })),

    z
        .object({
            YANDEX_SPEECH_KIT_API_KEY: z.string(),
        })
        .transform((env) => ({
            yandexSpeechKit: {
                apiKey: env.YANDEX_SPEECH_KIT_API_KEY,
            },
        })),
    z.object({}).transform((env) => ({
        debug: {},
    })),
] as const

type EnvValues = Prettify<UnionToIntersection<z.infer<(typeof envSchemas)[number]>>>

type Primitive = string | number | boolean | bigint | symbol | null | undefined

type IsTraversableObject<T> =
    // не спускаемся в массивы и кортежи
    T extends readonly unknown[]
        ? false
        : // не спускаемся в функции
          T extends (...args: any) => any
          ? false
          : // не спускаемся в популярные built-ins
            T extends
                  | Date
                  | RegExp
                  | Map<any, any>
                  | Set<any>
                  | WeakMap<any, any>
                  | WeakSet<any>
                  | Promise<any>
            ? false
            : // примитивы — не объект для обхода
              T extends Primitive
              ? false
              : // «обычные» объекты — да
                T extends object
                ? true
                : false

type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`

// счётчик глубины
type Depths = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

type KeyPaths<T, Prefix extends string = '', Depth extends number = 5> = [Depth] extends [never]
    ? never
    : IsTraversableObject<T> extends true
      ? {
            // берём только строковые ключи, чтобы не словить символы/числа
            [K in Extract<keyof T, string>]:
                | Join<Prefix, K> // сам ключ — как путь
                | KeyPaths<T[K], Join<Prefix, K>, Depths[Depth]> // углубляемся, если можно
        }[Extract<keyof T, string>]
      : never

class InternalConstants {
    private valuesMaskKeyPaths: Set<KeyPaths<EnvValues>>

    constructor() {
        const errors = []
        for (let index = 0; index < envSchemas.length; index++) {
            const schema = envSchemas[index]
            const result = schema.safeParse(process.env)
            if (result.success) {
                Object.assign(this, result.data)
            } else {
                errors.push(result.error)
            }
        }
        if (errors.length) {
            throw new AggregateError(errors, 'Environment variables validation error')
        }

        this.valuesMaskKeyPaths = new Set([
            'mongodb.password',
            'webhookAndPorts.apiAuthToken',
            'botTokens',
            'sheetContent.credentials.private_key',
            'sheetContent.credentials.auth_provider_x509_cert_url',
            'sheetContent.credentials.client_x509_cert_url',
            'yandexSpeechKit.apiKey',
        ] satisfies KeyPaths<EnvValues>[])
    }

    [inspect.custom]() {
        const mask = '[-SENSITIVE-DATA-]'

        return JSON.stringify(
            this,
            replacerWithPath((field, originalValue, keyPath) => {
                return this.valuesMaskKeyPaths.has(keyPath) ? mask : originalValue
            }),
            2
        )
    }
}

export const internalConstants = new InternalConstants() as InternalConstants & EnvValues

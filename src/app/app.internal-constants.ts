import { logger } from 'src/app/app.logger'

enum EnvKeys {
    // Mongo
    mongodbAddress = 'MONGODB_ADDRESS',
    mongodbDatabase = 'MONGODB_DATABASE',
    mongodbUser = 'MONGODB_USER',
    mongodbPassword = 'MONGODB_PASSWORD',

    // Webhook and ports
    isWebhookActive = 'IS_WEBHOOK_ACTIVE',
    webhookDomain = 'WEBHOOK_DOMAIN',
    appExposePort = 'APP_EXPOSE_PORT',
    appExposePortWebhook = 'APP_EXPOSE_PORT_WEBHOOK',
    appPorts = 'APP_PORTS',
    appPortsWebhook = 'APP_PORTS_WEBHOOK',
    enableInternalCors = 'ENABLE_INTERNAL_CORS',

    // Bot configuration
    botToken = 'BOT_TOKEN',
    fileStorageChatId = 'FILE_STORAGE_CHAT_ID',
    moderationChannelId = 'MODERATION_CHANNEL_ID',
    moderationChatId = 'MODERATION_CHAT_ID',
    publicationMainChannelId = 'PUBLICATION_MAIN_CHANNEL_ID',
    publicationMainChannelName = 'PUBLICATION_MAIN_CHANNEL_NAME',
    moderationForumId = 'MODERATION_FORUM_ID',
    errorsChatId = 'ERRORS_CHAT_ID',

    // GPT
    gptApiKey = 'GPT_API_KEY',
    gptModelUri = 'GPT_MODEL_URI',

    // Yandex SpeechKit
    yandexSpeechKitApiKey = 'YANDEX_SPEECH_KIT_API_KEY',

    // Payment
    paymentProviderToken = 'PAYMENT_PROVIDER_TOKEN',

    // Other
    appTz = 'APP_TZ',
    googleSpreadsheetId = 'GOOGLE_SPREADSHEET_ID',
    cacheBotContentOnStart = 'CACHE_BOT_CONTENT_ON_START',
    projectVersion = 'PROJECT_VERSION',
}

class InternalConstants {
    // =====================
    // Properties
    // =====================

    // Mongo
    get mongodbAddress(): string {
        return this.getEnvString(EnvKeys.mongodbAddress)
    }
    get mongodbDatabase(): string {
        return this.getEnvString(EnvKeys.mongodbDatabase)
    }
    get mongodbUser(): string {
        return this.getEnvString(EnvKeys.mongodbUser)
    }
    get mongodbPassword(): string {
        return this.getEnvString(EnvKeys.mongodbPassword)
    }

    // Webhook and ports
    get isWebhookActive(): boolean {
        return this.getEnvBoolean(EnvKeys.isWebhookActive)
    }
    get webhookDomain(): string {
        return this.getEnvString(EnvKeys.webhookDomain)
    }
    get appExposePort(): number {
        return this.getEnvNumber(EnvKeys.appExposePort)
    }
    get appExposePortWebhook(): number {
        return this.getEnvNumber(EnvKeys.appExposePortWebhook)
    }
    get appPorts(): string {
        return this.getEnvString(EnvKeys.appPorts)
    }
    get appPortsWebhook(): string {
        return this.getEnvString(EnvKeys.appPortsWebhook)
    }
    get enableInternalCors(): boolean {
        return this.getEnvBoolean(EnvKeys.enableInternalCors)
    }

    // Bot configuration
    get botToken(): string {
        return this.getEnvString(EnvKeys.botToken)
    }
    get fileStorageChatId(): number {
        return this.getEnvNumber(EnvKeys.fileStorageChatId)
    }
    get moderationChannelId(): number {
        return this.getEnvNumber(EnvKeys.moderationChannelId)
    }
    get moderationChatId(): number {
        return this.getEnvNumber(EnvKeys.moderationChatId)
    }
    get publicationMainChannelId(): number {
        return this.getEnvNumber(EnvKeys.publicationMainChannelId)
    }
    get publicationMainChannelName(): string {
        return this.getEnvString(EnvKeys.publicationMainChannelName)
    }
    get moderationForumId(): number {
        return this.getEnvNumber(EnvKeys.moderationForumId)
    }
    get errorsChatId(): number {
        return this.getEnvNumber(EnvKeys.errorsChatId)
    }

    // GPT
    get gptApiKey(): string {
        return this.getEnvString(EnvKeys.gptApiKey)
    }
    get gptModelUri(): string {
        return this.getEnvString(EnvKeys.gptModelUri)
    }

    // YandexSpeechKit
    get yandexSpeechKitApiKey(): string {
        return this.getEnvString(EnvKeys.yandexSpeechKitApiKey)
    }

    // Other
    get npmPackageVersion(): string {
        return process.env.npm_package_version ?? this.getEnvString(EnvKeys.projectVersion) ?? null
    }
    get defaultLanguage(): string {
        return 'RU'
    }
    get loadingServiceChatMessagePrefix(): string {
        return 'Loading...\nid:'
    }
    get appTimeZoneUtcOffset(): number {
        return this.getEnvNumber(EnvKeys.appTz)
    }
    get googleSpreadsheetId(): string {
        return this.getEnvString(EnvKeys.googleSpreadsheetId)
    }
    get cacheBotContentOnStart(): boolean {
        return this.getEnvBoolean(EnvKeys.cacheBotContentOnStart)
    }

    // =====================
    // Public methods
    // =====================

    /** Needs for json lib convertation */
    toJSON() {
        const proto = Object.getPrototypeOf(this)
        const jsonObj: any = Object.assign({}, this)

        Object.entries(Object.getOwnPropertyDescriptors(proto))
            .filter(([key, descriptor]) => typeof descriptor.get === 'function')
            .map(([key, descriptor]) => {
                if (descriptor && key[0] !== '_') {
                    try {
                        const val = (this as any)[key]
                        jsonObj[key] = val
                    } catch (error) {
                        logger.error(`Error calling getter ${key}`, error)
                        throw error
                    }
                }
            })

        return jsonObj
    }

    dropProcessCache() {
        for (const key in EnvKeys) {
            process.env[EnvKeys[key as keyof typeof EnvKeys] as string] = undefined
        }
    }

    // =====================
    // Private methods
    // =====================

    private getEnvString(key: EnvKeys): string {
        const envValue = process.env[key]
        if (!envValue) throw Error(`Fail to get env string value for key: ${key}`)
        return envValue
    }

    private getEnvNumber(key: EnvKeys): number {
        const envValue = Number(process.env[key])
        if (!envValue) throw Error(`Fail to get env number value for key: ${key}`)
        return envValue
    }

    private getEnvBoolean(key: EnvKeys): boolean {
        const envValue = process.env[key]
        if (!envValue) throw Error(`Fail to get env boolean value for key: ${key}`)
        if (envValue !== 'true' && envValue !== 'false') {
            throw Error(`Fail to get env boolean value for key: ${key}`)
        }
        return envValue === 'true'
    }
}

export const internalConstants: InternalConstants = new InternalConstants()

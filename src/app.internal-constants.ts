import { logger } from './app.logger'

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
    errorsChatId = 'ERRORS_CHAT_ID',

    // GPT
    gptApiKey = 'GPT_API_KEY',
    gptModel = 'GPT_MODEL',
    gptMaxTokens = 'GPT_MAX_TOKENS',
    gptModelTemperature = 'GPT_MODEL_TEMPERATURE',
    gptProxyUrl = 'GPT_PROXY_URL',

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
    get errorsChatId(): number {
        return this.getEnvNumber(EnvKeys.errorsChatId)
    }

    // GPT
    get gptApiKey(): string {
        return this.getEnvString(EnvKeys.gptApiKey)
    }
    get gptModel(): string {
        return this.getEnvString(EnvKeys.gptModel)
    }
    get gptMaxTokens(): string {
        return this.getEnvString(EnvKeys.gptMaxTokens)
    }
    get gptModelTemperature(): number {
        return this.getEnvNumber(EnvKeys.gptModelTemperature)
    }
    get gptProxyUrl(): string {
        return this.getEnvString(EnvKeys.gptProxyUrl)
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
            // @ts-ignore: Unreachable code error
            process.env[EnvKeys[key] as string] = undefined
        }
    }

    // =====================
    // Private methods
    // =====================

    private getEnvString(key: EnvKeys): string {
        const envValue = process.env[key]
        if (!envValue) throw new Error(`Fail to get env string value for key: ${key}`)
        return envValue
    }

    private getEnvNumber(key: EnvKeys): number {
        const envValue = Number(process.env[key])
        if (!envValue) throw new Error(`Fail to get env number value for key: ${key}`)
        return envValue
    }

    private getEnvBoolean(key: EnvKeys): boolean {
        const envValue = process.env[key]
        if (!envValue) throw new Error(`Fail to get env boolean value for key: ${key}`)
        if (envValue !== 'true' && envValue !== 'false') {
            throw new Error(`Fail to get env boolean value for key: ${key}`)
        }
        return envValue === 'true'
    }
}

export const internalConstants: InternalConstants = new InternalConstants()

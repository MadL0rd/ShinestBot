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
    advertsMainChannelId = 'ADVERTS_MAIN_CHANNEL_ID',
    advertsMainChannelName = 'ADVERTS_MAIN_CHANNEL_NAME',
    advertsWebPageBaseUrl = 'ADVERTS_WEB_PAGE_BASE_URL',

    // Other
    appTz = 'APP_TZ',
    googleSpreadsheetId = 'GOOGLE_SPREADSHEET_ID',
    cacheBotContentOnStart = 'CACHE_BOT_CONTENT_ON_START',
}

class InternalConstants {
    // =====================
    // Properties
    // =====================

    // Mongo
    get mongodbAddress(): string | null {
        return this.getEnvString(EnvKeys.mongodbAddress)
    }
    get mongodbDatabase(): string | null {
        return this.getEnvString(EnvKeys.mongodbDatabase)
    }
    get mongodbUser(): string | null {
        return this.getEnvString(EnvKeys.mongodbUser)
    }
    get mongodbPassword(): string | null {
        return this.getEnvString(EnvKeys.mongodbPassword)
    }

    // Webhook and ports
    get isWebhookActive(): string | null {
        return this.getEnvString(EnvKeys.isWebhookActive)
    }
    get webhookDomain(): string | null {
        return this.getEnvString(EnvKeys.webhookDomain)
    }
    get appExposePort(): number | null {
        return this.getEnvNumber(EnvKeys.appExposePort)
    }
    get appExposePortWebhook(): number | null {
        return this.getEnvNumber(EnvKeys.appExposePortWebhook)
    }
    get appPorts(): string | null {
        return this.getEnvString(EnvKeys.appPorts)
    }
    get appPortsWebhook(): string | null {
        return this.getEnvString(EnvKeys.appPortsWebhook)
    }
    get enableInternalCors(): boolean | null {
        return this.getEnvBoolean(EnvKeys.enableInternalCors)
    }

    // Bot configuration
    get botToken(): string | null {
        return this.getEnvString(EnvKeys.botToken)
    }
    get fileStorageChatId(): number | null {
        return this.getEnvNumber(EnvKeys.fileStorageChatId)
    }
    get moderationChannelId(): number | null {
        return this.getEnvNumber(EnvKeys.moderationChannelId)
    }
    get moderationChatId(): number | null {
        return this.getEnvNumber(EnvKeys.moderationChatId)
    }
    get advertsMainChannelId(): number | null {
        return this.getEnvNumber(EnvKeys.advertsMainChannelId)
    }
    get advertsMainChannelName(): string | null {
        return this.getEnvString(EnvKeys.advertsMainChannelName)
    }
    get advertsWebPageBaseUrl(): string | null {
        return this.getEnvString(EnvKeys.advertsWebPageBaseUrl)
    }

    // Other
    get npmPackageVersion(): string | null {
        return process.env.npm_package_version
    }
    get defaultLanguage(): string | null {
        return 'RU'
    }
    get loadingServiceChatMessagePrefix(): string | null {
        return 'Loading...\nid:'
    }
    get appTimeZoneUtcOffset(): string | null {
        return this.getEnvString(EnvKeys.appTz)
    }
    get googleSpreadsheetId(): string | null {
        return this.getEnvString(EnvKeys.googleSpreadsheetId)
    }
    get cacheBotContentOnStart(): boolean | null {
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
                        console.error(`Error calling getter ${key}`, error)
                    }
                }
            })

        return jsonObj
    }

    // =====================
    // Private methods
    // =====================

    private getEnvString(key: EnvKeys): string | null {
        return process.env[key] ?? null
    }

    private getEnvNumber(key: EnvKeys): number | null {
        return Number(process.env[key]) ?? null
    }

    private getEnvBoolean(key: EnvKeys): boolean | null {
        const value = process.env[key]
        if (typeof value != 'string') return null
        return value == 'true'
    }
}

export const internalConstants: InternalConstants = new InternalConstants()

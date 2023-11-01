interface InternalConstants {
    readonly defaultLanguage: string
    readonly appTimeZone: string
    readonly fileStorageChatId: number
    readonly moderationChannelId: number
    readonly moderationChatId: number
    readonly advertsMainChannelId: number
    readonly advertsMainChannelName: string
    readonly advertsWebPageBaseUrl: string
    readonly loadingServiceChatMessagePrefix: string
    readonly cacheBotContentOnStart: boolean
    readonly enableInternalCors: boolean
}

export const internalConstants: InternalConstants = {
    defaultLanguage: 'RU',
    appTimeZone: process.env.APP_TZ ?? 'Europe/Moscow',
    fileStorageChatId: Number(process.env.FILE_STORAGE_CHAT_ID) ?? -1001906380557,
    moderationChannelId: Number(process.env.MODERATION_CHANNEL_ID) ?? -1001769686606,
    moderationChatId: Number(process.env.MODERATION_CHATL_ID) ?? -1001901508400,
    advertsMainChannelId: Number(process.env.ADVERTS_MAIN_CHANNEL_ID) ?? -1001923686274,
    advertsMainChannelName: process.env.ADVERTS_MAIN_CHANNEL_NAME ?? 'JustSellChannelTest',
    advertsWebPageBaseUrl:
        process.env.ADVERTS_WEB_PAGE_BASE_URL ?? 'https://adverts.justsell.pro/dev',
    loadingServiceChatMessagePrefix: 'Loading...\nid:',
    enableInternalCors: process.env.ENABLE_INTERNAL_CORS == 'true',
    cacheBotContentOnStart: process.env.CACHE_BOT_CONTENT_ON_START == 'true',
}

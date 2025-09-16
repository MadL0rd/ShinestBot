import { StatisticColumnDto } from '../dto/event-statistic-column.dto'

export type StatisticSheetDto = {
    titles: {
        totalEventsCount: string
        uniqueUserActions: string
    }
    columns: StatisticColumnDto[]
}

export const statisticSheetSchemas = {
    common: {
        titles: {
            totalEventsCount: 'Общее Сумма',
            uniqueUserActions: 'Общее Уник.польз',
        },
        columns: [
            {
                type: 'data',
                event: { type: 'userCreated' },
                columnTitle: 'Старт',
            },
            { type: 'spacer' },
        ],
    },
    menuButtons: {
        titles: {
            totalEventsCount: 'Кнопки+WebApps Сумма',
            uniqueUserActions: 'Кнопки+WebApps Уник.польз',
        },
        columns: [
            {
                type: 'data',
                event: { type: 'userOpenWebApp', webAppType: 'tournaments' },
                columnTitle: 'Открыл WebApp турнир',
            },
            {
                type: 'data',
                event: { type: 'userOpenWebApp', webAppType: 'zaruba' },
                columnTitle: 'Открыл WebApp заруба',
            },
            {
                type: 'data',
                event: { type: 'userOpenWebApp', webAppType: 'referrals' },
                columnTitle: 'Открыл WebApp рефералы',
            },
            { type: 'spacer' },
            {
                type: 'data',
                event: { type: 'sendMessage' },
                columnTitle: 'Общее количество сообщений',
            },
            { type: 'spacer' },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '❓Нужна помощь техподдержки' },
                columnTitle: '❓Нужна помощь техподдержки',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '❗️Стать ПАРКОВЫМ самозанятым' },
                columnTitle: '❗️Стать ПАРКОВЫМ самозанятым',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '📊 Статистика за день' },
                columnTitle: '📊 Статистика за день',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '🤔 Я на линии?' },
                columnTitle: '🤔 Я на линии?',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '🤝 Пригласить друга' },
                columnTitle: '🤝 Пригласить друга',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '🎓 Академия БК' },
                columnTitle: '🎓 Академия БК',
            },
            {
                type: 'data',
                event: { type: 'sendMessage', text: '💳 Вывод денег' },
                columnTitle: '💳 Вывод денег',
            },
        ],
    },
    blockingAndUnblockingTheBot: {
        titles: {
            totalEventsCount: 'Блокировка Сумма',
            uniqueUserActions: 'Блокировка Уник.польз',
        },
        columns: [
            {
                type: 'data',
                event: { type: 'botBlocked' },
                columnTitle: 'Заблокировал бота',
            },
            {
                type: 'data',
                event: { type: 'botUnblocked' },
                columnTitle: 'Разблокировал бота',
            },
        ],
    },
} as const satisfies Record<string, StatisticSheetDto>

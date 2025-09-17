import { DataSheetPageSchema } from './data-sheet-page-schema.interface'
import { localizationCommon } from './spreadsheet-pages/localization-common.schema'
import { mainMenuMarkup } from './spreadsheet-pages/main-menu-markup.schema'
import { onboardingGroups } from './spreadsheet-pages/onboarding-groups.schema'
import { onboardingPages } from './spreadsheet-pages/onboarding-pages.schema'
import { redirectLinks } from './spreadsheet-pages/redirect-links.schema'
import { survey } from './spreadsheet-pages/survey.schema'
import { training } from './spreadsheet-pages/training.schema'
import { uniqueMessages } from './spreadsheet-pages/unique-messages.schema'
/** New spreadsheet page schema import placeholder */

export const spreadsheetSchema = {
    localizedStrings: {
        uniqueMessages: {
            sheetId: 'uniqueMessages',
            sheetPublicName: 'УникальныеСообщения',
            contentType: 'localizedStrings',
            ...uniqueMessages,
        } satisfies DataSheetPageSchema,
        localizationCommon: {
            sheetId: 'localizationCommon',
            sheetPublicName: 'Локализация',
            contentType: 'localizedStrings',
            ...localizationCommon,
        } satisfies DataSheetPageSchema,
    },
    commonContent: {
        uniqueMessagesContent: {
            sheetId: 'uniqueMessages',
            sheetPublicName: 'УникальныеСообщения',
            contentType: 'commonContent',
            ...uniqueMessages,
        } satisfies DataSheetPageSchema,
        onboardingGroups: {
            sheetId: 'onboardingGroups',
            sheetPublicName: 'ОнбордингГруппы',
            contentType: 'commonContent',
            ...onboardingGroups,
        } satisfies DataSheetPageSchema,
        onboardingPages: {
            sheetId: 'onboardingPages',
            sheetPublicName: 'ОнбордингКонтент',
            contentType: 'commonContent',
            ...onboardingPages,
        } satisfies DataSheetPageSchema,
        survey: {
            sheetId: 'survey',
            sheetPublicName: 'Опрос',
            contentType: 'commonContent',
            ...survey,
        } satisfies DataSheetPageSchema,
        training: {
            sheetId: 'training',
            sheetPublicName: 'Обучение',
            contentType: 'commonContent',
            ...training,
        } satisfies DataSheetPageSchema,
        mainMenuMarkup: {
            sheetId: 'mainMenuMarkup',
            sheetPublicName: 'ГлавноеМеню',
            contentType: 'commonContent',
            ...mainMenuMarkup,
        } satisfies DataSheetPageSchema,
        redirectLinks: {
            sheetId: 'redirectLinks',
            sheetPublicName: 'РедиректСсылки',
            contentType: 'commonContent',
            ...redirectLinks,
        } satisfies DataSheetPageSchema,
        /** New spreadsheet page schema placeholder */
    },
} as const

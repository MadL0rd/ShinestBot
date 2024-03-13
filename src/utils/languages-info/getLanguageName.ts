import * as languagesInfo from './languagesInfo.json'

export namespace LanguageCode {
    export type Union = keyof typeof languagesInfo
    export const allCases = Object.keys(languagesInfo) as Union[]

    export function castToInstance(value?: string | Union | null): Union | null {
        if (!value) return null
        return allCases.includes(value) ? (value as Union) : null
    }

    export function getLanguageName(countryCode: string): string {
        if (!allCases.includes(countryCode)) return countryCode
        const language = languagesInfo[countryCode as Union] as LanguagesInfoType

        const languageName = language.nativeName ?? countryCode

        if (!language.emoji) return languageName
        else return `${language.emoji} ${languageName}`
    }

    class LanguagesInfoType {
        name: string
        nativeName: string
        country: object
        emoji?: string
    }
}

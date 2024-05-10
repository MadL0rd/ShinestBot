import * as languagesInfo from './languages-info.json'

export namespace LanguageCode {
    export type Union = keyof typeof languagesInfo
    export const allCases = Object.keys(languagesInfo) as Union[]

    export function isInstance(value?: string | Union | null): value is Union {
        if (!value) return false
        return allCases.includes(value)
    }

    export function castToInstance(value?: string | Union | null): Union | null {
        return isInstance(value) ? value : null
    }

    export function getLanguageName(countryCode: string): string {
        if (!isInstance(countryCode)) return countryCode
        const language = languagesInfo[countryCode] as LanguagesInfoType

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

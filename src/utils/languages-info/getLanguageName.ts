import * as languagesInfo from './languagesInfo.json'

class LanguagesInfoType {
    name: string
    nativeName: string
    country: object
    emoji?: string
}

export function getLanguageName(countryCode: string): string {
    if (!Object.keys(languagesInfo).includes(countryCode)) return countryCode
    type ObjectKey = keyof typeof languagesInfo
    const language = languagesInfo[countryCode as ObjectKey] as LanguagesInfoType

    const languageName = language.nativeName ?? countryCode

    if (!language.emoji) return languageName
    else return `${language.emoji} ${languageName}`
}

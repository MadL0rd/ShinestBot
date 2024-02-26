import * as pageTitlesInfo from './SpreadsheetPageTitles.json'

export namespace SpreadsheetPageTitles {
    export const items = pageTitlesInfo
    export type keysUnion = keyof typeof items
    export const allKeys = Object.keys(pageTitlesInfo) as keysUnion[]
}

export interface DataSheetPageSchema {
    sheetId: string
    sheetPublicName: string
    contentType: 'common' | 'localizedStrings'
    cacheConfiguration: {
        configurationRow: number
        firstContentRow: number
        lastContentRow: number
        firstLetter: string
        lastLetter: string
    }
    validation: {
        minRowLength: number
        requiredFields: Record<string, string>
    }
    itemPrototype: Record<string, string>
}
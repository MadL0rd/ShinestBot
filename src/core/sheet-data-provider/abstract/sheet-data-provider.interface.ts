export interface ISheetDataProvider {
    getContentFromPage(pageName: string, range: string): Promise<string[][]>
}

export interface ISheetDataProvider {
    getContentByListName(pageName: string, range: string): Promise<string[][]>
}

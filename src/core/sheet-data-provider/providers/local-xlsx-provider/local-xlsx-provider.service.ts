import { Injectable } from '@nestjs/common'
import { logger } from 'src/app/app.logger'
import * as XLSX from 'xlsx'
import { ISheetDataProvider } from '../../abstract/sheet-data-provider.interface'

@Injectable()
export class LocalXlsxProviderService implements ISheetDataProvider {
    constructor() {}

    async getContentFromPage(pageName: string, range: string): Promise<string[][]> {
        logger.log(`Start cache ${pageName}`)

        const workbook = XLSX.read('./ShinestBotOpenDataTable.xlsx', {
            type: 'file',
            sheet: pageName,
        })
        const worksheet = workbook.Sheets[pageName]
        const localRows: string[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: range,
            raw: false,
        })
        const rows = localRows.filter((row) => row.isNotEmpty)

        return rows
    }
}

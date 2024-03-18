import { Injectable } from '@nestjs/common'
import { ISheetDataProvider } from '../../abscract/sheet-data-provider.interface'
import { SheetStringsMarkdownValidatorService } from '../../sheet-strings-markdown-validator/sheet-strings-markdown-validator.service'
import { logger } from 'src/app/app.logger'
import * as XLSX from 'xlsx'

@Injectable()
export class LocalXlsxProviderService implements ISheetDataProvider {
    constructor(private readonly rowsValidator: SheetStringsMarkdownValidatorService) {}

    async getContentByListName(pageName: string, range: string): Promise<string[][]> {
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

        return this.rowsValidator.validateAndUpdateRows(rows)
    }
}

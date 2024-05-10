import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { GoogleSpreadsheetCredentialsService } from './google-spreadsheet-credentials.service'
import { ISheetDataProvider } from '../../abscract/sheet-data-provider.interface'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { SheetStringsMarkdownValidatorService } from '../../sheet-strings-markdown-validator/sheet-strings-markdown-validator.service'

@Injectable()
export class GoogleSpreadsheetProviderService implements ISheetDataProvider {
    private readonly spreadsheetId = internalConstants.googleSpreadsheetId

    constructor(
        private readonly googleCredentialsService: GoogleSpreadsheetCredentialsService,
        private readonly rowsValidator?: SheetStringsMarkdownValidatorService
    ) {}

    async getContentByListName(pageName: string, range: string): Promise<string[][]> {
        logger.log(`Start cache ${pageName}`)

        const auth = await this.googleCredentialsService.authorize()
        const sheets = google.sheets({ version: 'v4', auth: auth })
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${pageName}!${range}`,
        })
        const rows = res.data.values
        if (!rows || rows.length === 0) {
            logger.warn('No data found.')
            return []
        }

        return this.rowsValidator?.validateAndUpdateRows(rows) ?? rows
    }
}

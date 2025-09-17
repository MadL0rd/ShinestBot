import { Injectable } from '@nestjs/common'
import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { ISheetDataProvider } from '../../abstract/sheet-data-provider.interface'

@Injectable()
export class GoogleSpreadsheetProviderService implements ISheetDataProvider {
    constructor() {}

    async getContentFromPage(pageName: string, range: string): Promise<string[][]> {
        logger.log(`Start cache ${pageName}`)

        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            credentials: internalConstants.sheetContent.credentials,
        })
        const sheets = google.sheets({ version: 'v4', auth: auth })
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: internalConstants.sheetContent.googleSpreadsheetId,
            range: `${pageName}!${range}`,
        })

        return result.data.values ?? []
    }
}

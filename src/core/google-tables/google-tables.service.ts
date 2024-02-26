import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { GoogleCredentialsService } from './google-credentials.service'
import { SpreadsheetPageTitles } from './enums/spreadsheet-page-titles'
import { logger } from '../../app.logger'
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'
import { internalConstants } from 'src/app.internal-constants'

@Injectable()
export class GoogleTablesService {
    constructor(private readonly googleCredentialsService: GoogleCredentialsService) {}

    private readonly spreadsheetId = internalConstants.googleSpreadsheetId

    async getContentByListName(
        pageNameKey: SpreadsheetPageTitles.keysUnion,
        range: string
    ): Promise<string[][]> {
        const pageName = SpreadsheetPageTitles.items[pageNameKey]
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

        // Markdown telegram spec symbols fix
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                const row = rows[i][j] as string
                if (row) {
                    rows[i][j] = replaceMarkdownWithHtml(row).trimmed
                }
            }
        }
        return rows
    }
}

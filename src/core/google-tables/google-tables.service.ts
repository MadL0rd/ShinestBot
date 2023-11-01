import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { GoogleCredentialsService } from './google-credentials.service'
import { PageNameEnum } from './enums/page-name.enum'
import { ConfigService } from '@nestjs/config'
import { logger } from '../../app.logger'
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'

@Injectable()
export class GoogleTablesService {
    constructor(
        private readonly configService: ConfigService,
        private readonly googleCredentialsService: GoogleCredentialsService
    ) {}

    private readonly spreadsheetId = '1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA'

    async getContentByListName(
        pageName: PageNameEnum | string,
        range: string
    ): Promise<string[][]> {
        logger.log(`Start cache ${pageName}`, GoogleTablesService.name)

        const auth = await this.googleCredentialsService.authorize()
        const sheets = google.sheets({ version: 'v4', auth: auth })
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${pageName}!${range}`,
        })
        const rows = res.data.values
        if (!rows || rows.length === 0) {
            console.log('No data found.')
            return
        }

        // Markdown telegram spec symbols fix
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                const row = rows[i][j] as string
                if (row) {
                    rows[i][j] = replaceMarkdownWithHtml(row)
                }
            }
        }
        return rows
    }
}

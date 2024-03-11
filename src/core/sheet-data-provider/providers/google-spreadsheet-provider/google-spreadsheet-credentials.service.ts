import * as path from 'path'
import { google } from 'googleapis'
import * as process from 'node:process'
import { Injectable } from '@nestjs/common'

@Injectable()
export class GoogleSpreadsheetCredentialsService {
    // If modifying these scopes, delete token.json.
    private readonly SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    private readonly CREDENTIALS_PATH = path.join(process.cwd(), '/', 'credentials.json')

    async authorize() {
        const auth = new google.auth.GoogleAuth({
            scopes: this.SCOPES,
            keyFile: this.CREDENTIALS_PATH,
        })
        // const client = await auth.getClient()
        // if (client.credentials) {
        //     await this.saveCredentials(client)
        // }
        return auth
    }
}

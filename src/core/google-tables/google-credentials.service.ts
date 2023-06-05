import * as path from 'path'
import * as fs from 'fs'
import { google } from 'googleapis'
import { authenticate } from '@google-cloud/local-auth'
import * as process from 'node:process'
import { Injectable } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth'

@Injectable()
export class GoogleCredentialsService {
    //constructor() {}

    // If modifying these scopes, delete token.json.
    private readonly SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    //private readonly TOKEN_PATH = path.join(process.cwd(), '/', 'token.json')
    private readonly CREDENTIALS_PATH = path.join(process.cwd(), '/', 'credentials.json')

    /**
     * Reads previously authorized credentials from the save file.
     *
     * @return {Promise<OAuth2Client|null>}
     */
    /*async loadSavedCredentialsIfExist(): Promise<JSONClient | null> {
        try {
            const content = await fs.readFileSync(this.TOKEN_PATH)
            const credentials = JSON.parse(content.toString())
            return google.auth.fromJSON(credentials)
        } catch (err) {
            return null
        }
    }*/

    /**
     * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
     *
     * @param {OAuth2Client} client
     * @return {Promise<void>}
     */
    /*async saveCredentials(client) {
        const content = await fs.readFileSync(this.CREDENTIALS_PATH)
        const keys = JSON.parse(content.toString())
        //const key = keys.installed || keys.web
        const payload = JSON.stringify({
            type: keys.type, //'authorized_user',
            client_id: keys.client_id,
            client_secret: keys.client_secret,
            refresh_token: client.credentials.refresh_token,
        })
        await fs.writeFileSync(this.TOKEN_PATH, payload)
    }*/

    /**
     * Load or request or authorization to call APIs.
     *
     */
    async authorize() /*: Promise<OAuth2Client | JSONClient>*/ {
        /*const savedClient = await this.loadSavedCredentialsIfExist()
        if (savedClient) {
            return savedClient
        }*/
        const auth = new google.auth.GoogleAuth({
            scopes: this.SCOPES,
            keyFile: this.CREDENTIALS_PATH,
        })
        const client = await auth.getClient()
        /*if (client.credentials) {
            await this.saveCredentials(client)
        }*/
        return auth
    }

    //authorize().then(listMajors).catch(console.error)
}

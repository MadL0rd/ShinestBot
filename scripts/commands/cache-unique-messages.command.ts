import * as fs from 'fs'
import * as path from 'path'
import { Injectable } from '@nestjs/common'
import { Command, CommandRunner } from 'nest-commander'
import { SheetDataProviderService } from 'src/core/sheet-data-provider/sheet-data-provider.service'
import { internalConstants } from 'src/app/app.internal-constants'

function ensureDirectoryExistence(filePath: string) {
    const dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
        return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
}

@Injectable()
@Command({
    name: 'generate-unique-messages',
    aliases: ['gum'],
    description: 'Generate unique-messages.json',
})
export class CacheUniqueMessagesCommand extends CommandRunner {
    private readonly cachedTrueValue = 'TRUE'

    constructor(private readonly sheetDataProvider: SheetDataProviderService) {
        super()
    }

    async run(): Promise<void> {
        const uniqueMessagesCached = await this.sheetDataProvider.getContentFrom(
            'uniqueMessagesContent',
            true
        )
        const uniqueMessagesJson = uniqueMessagesCached
            .filter((row) => row.isUniqueMessage === this.cachedTrueValue)
            .map((row) => {
                const params = row.params
                    ?.split('\n')
                    .map((param) => param.split('/').map((component) => component.trim()))
                    .filter((param) => param.length > 1)
                    .map((param) => {
                        return {
                            name: param[0],
                            type: param[1],
                        }
                    })
                if (row.sourceRowIndex) {
                    const rowUrl = `https://docs.google.com/spreadsheets/d/${internalConstants.googleSpreadsheetId}/edit#gid=0&range=${row.sourceRowIndex}:${row.sourceRowIndex}`
                    const rowLink = `[Spreadsheet row link](${rowUrl})`
                    row.comment = row.comment ? `${row.comment}\n\n${rowLink}` : rowLink
                }
                return {
                    group: row.group,
                    key: row.key,
                    value: row.defaultValue,
                    comment: row.comment,
                    params: params ?? [],
                }
            })
        const jsonString = JSON.stringify(uniqueMessagesJson, null, 2)
        const filePath = 'scripts/files-buff/unique-messages.json'
        ensureDirectoryExistence(filePath)
        fs.writeFileSync(filePath, jsonString, 'utf8')
    }
}

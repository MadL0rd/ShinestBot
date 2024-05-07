import { Injectable } from '@nestjs/common'
import { Command, CommandRunner } from 'nest-commander'
import { SheetDataProviderService } from 'src/core/sheet-data-provider/sheet-data-provider.service'
import * as fs from 'fs'
import * as path from 'path'

function ensureDirectoryExistence(filePath: string) {
    const dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
        return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
}

@Injectable()
@Command({ name: 'g', description: 'Jopa' })
export class CacheUniqueMessagesCommand extends CommandRunner {
    private readonly cachedTrueValue = 'TRUE'

    constructor(private readonly sheetDataProvider: SheetDataProviderService) {
        super()
    }

    async run(): Promise<void> {
        const uniqueMessagesCached =
            await this.sheetDataProvider.getContentFrom('uniqueMessagesContent')
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

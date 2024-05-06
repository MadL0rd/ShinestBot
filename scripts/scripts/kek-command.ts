import { Injectable } from '@nestjs/common'
import { Command, CommandRunner } from 'nest-commander'
import { SheetDataProviderService } from 'src/core/sheet-data-provider/sheet-data-provider.service'
import * as fs from 'fs'
import * as path from 'path'
import {
    CliConfig,
    CliConfigSchema,
    Other,
    OtherSchema,
    UniqueMessagesConfigElement,
    UniqueMessagesConfigSchema,
} from './cli-config-schema'
import chalk from 'chalk'

import util from 'util'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = util.promisify(require('child_process').exec)

export async function runScript(script = '') {
    try {
        await exec(script)
    } catch (e) {
        console.error(e) // should contain code (exit code) and signal (that caused the termination).
    }
}
function ensureDirectoryExistence(filePath: string) {
    const dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
        return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
}

function separateWordComponents(name: string): string[] {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter((word) => word.length > 1)
}

function titleCase(word: string) {
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
}

function casePascal(name: string): string {
    if (!name) return name
    return separateWordComponents(name)
        .map((word) => titleCase(word))
        .join('')
}

function caseCamel(name: string): string {
    if (!name) return name
    return separateWordComponents(name)
        .map((word, index) => (index == 0 ? word : titleCase(word)))
        .join('')
}

function caseKebub(name: string) {
    if (!name) return name
    return separateWordComponents(name).join('-')
}

@Injectable()
@Command({ name: 'g', description: 'Jopa' })
export class KekCommand extends CommandRunner {
    private readonly cachedTrueValue = 'TRUE'

    constructor(private readonly sheetDataProvider: SheetDataProviderService) {
        super()
    }

    async run(): Promise<void> {
        const p = await import('@clack/prompts')
        const sayGoodbye = function () {
            p.outro(chalk.greenBright('Goodbye 👋'))
        }
        const kek = `
|   .dSSSSb.  SSS      dSb                            SSS    SSSSSSb.            SSS           .dSSSSb.  SSS      SSSSSSS 
|  dSSP  YSSb SSS      YSP                            SSS    SSS  "SSb           SSS          dSSP  YSSb SSS        SSS   
|  YSSb.      SSS                                     SSS    SSS  .SSP           SSS          SSS    SSS SSS        SSS   
|   "YSSSb.   SSSSSb.  SSS SSSSSb.   .dSSb.  .dSSSSb  SSSSSS SSSSSSSK.   .dSSb.  SSSSSS       SSS        SSS        SSS   
|      "YSSb. SSS "SSb SSS SSS "SSb dSP  YSb SSK      SSS    SSS  "YSSb dSS""SSb SSS          SSS        SSS        SSS   
|        "SSS SSS  SSS SSS SSS  SSS SSSSSSSS "YSSSSb. SSS    SSS    SSS SSS  SSS SSS          SSS    SSS SSS        SSS   
|  YSSb  dSSP SSS  SSS SSS SSS  SSS YSb.          XSS YSSb.  SSS   dSSP YSS..SSP YSSb.        YSSb  dSSP SSS        SSS   
|   "YSSSSP"  SSS  SSS SSS SSS  SSS  "YSSSS   SSSSSP'  "YSSS SSSSSSSP"   "YSSP"   "YSSS        "YSSSSP"  SSSSSSSS SSSSSSS `

        p.intro(`${kek}\nWelcome to ShinestBot CLI!`)

        const configRaw = fs.readFileSync('./shinest-cli.json', 'utf8')
        const config = CliConfigSchema.parse(JSON.parse(configRaw))

        const uniqueMessagesGenerationOption = 'uniqueMessages'
        const exitOption = 'exit'
        const selectedOptionRaw = await p.select({
            message: 'Kek wait zalupa?',
            initialValue: '1',
            options: [
                {
                    value: uniqueMessagesGenerationOption,
                    label: 'Generate unique messages file',
                    hint: `source: ${config.generationScripts.uniqueMessages.jsonConfigFilePath}`,
                },
                ...config.generationScripts.other.map((option) => {
                    return { value: option.title }
                }),
                { value: exitOption, label: 'Exit' },
            ],
        })

        switch (selectedOptionRaw) {
            case uniqueMessagesGenerationOption:
                await this.generateUniqueMessages(config)
                break

            case exitOption:
                sayGoodbye()
                return

            default:
                const selectedOption = config.generationScripts.other.find(
                    (option) => option.title === selectedOptionRaw
                )
                if (!selectedOption) {
                    sayGoodbye()
                    return
                }
                await this.generateCustomFile(selectedOption)

                break
        }

        if (config.format.applyOnCommandsCompletion && config.format.scrypt) {
            const loading = p.spinner()
            loading.start('Formatting in progress...')
            await runScript(config.format.scrypt)
            loading.stop('Formatting completed')
        }
        sayGoodbye()
    }

    private async generateCustomFile(config: Other) {
        const p = await import('@clack/prompts')
        const input = await p.text({
            message: config.nameQuestion,
        })
        const name = String(input)

        const loading = p.spinner()
        loading.start('Generating source code')

        // Replace valiables with names
        const placeholders = config.namePlaceholders
        const names = {
            caseCamel: caseCamel(name),
            casePascal: casePascal(name),
            caseKebub: caseKebub(name),
        }
        const configString = JSON.stringify(config)
            .replaceAll(placeholders.caseCamel, names.caseCamel)
            .replaceAll(placeholders.casePascal, names.casePascal)
            .replaceAll(placeholders.caseKebub, names.caseKebub)
        config = OtherSchema.parse(JSON.parse(configString))
        config.namePlaceholders = placeholders

        // Create files
        for (const file of config.createFiles) {
            const content = fs
                .readFileSync(file.templateFile, 'utf8')
                .replaceAll(placeholders.caseCamel, names.caseCamel)
                .replaceAll(placeholders.casePascal, names.casePascal)
                .replaceAll(placeholders.caseKebub, names.caseKebub)

            ensureDirectoryExistence(file.baseDir)
            fs.writeFileSync(path.join(file.baseDir, file.name), content, 'utf8')
        }

        // Update imports etc.
        for (const replacement of config.replacements) {
            const content = fs
                .readFileSync(replacement.filePath, 'utf8')
                .replaceAll(replacement.placeholder, replacement.replaceWith)

            fs.writeFileSync(replacement.filePath, content, 'utf8')
        }

        const createdFiles = config.createFiles
            .map((file) => chalk.blue(file.baseDir + file.name))
            .join()
        loading.stop(`Source code generated: ${createdFiles}`)
    }

    private async generateUniqueMessages(config: CliConfig) {
        const configUnique = config.generationScripts.uniqueMessages
        const p = await import('@clack/prompts')
        let loading = p.spinner()
        loading.start('Unique messages caching in progress...')
        // runScript(configUnique.cacheConfigCommand)
        const uniqueMessagesKek =
            await this.sheetDataProvider.getContentFrom('uniqueMessagesContent')
        const uniqueMessagesJson = uniqueMessagesKek
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
        ensureDirectoryExistence(configUnique.jsonConfigFilePath)
        fs.writeFileSync(configUnique.jsonConfigFilePath, jsonString, 'utf8')
        loading.stop('Unique messages caching complete')

        loading = p.spinner()
        loading.start('Generating source code')

        const uniqueMessages = UniqueMessagesConfigSchema.parse(uniqueMessagesJson)
        type GroupContent = {
            haveParams: boolean
            uniqueMessages: UniqueMessagesConfigElement[]
        }
        const groups: Record<string, GroupContent> = {}

        for (const item of uniqueMessages) {
            if (!groups[item.group]) {
                groups[item.group] = {
                    haveParams: false,
                    uniqueMessages: [],
                }
            }
            groups[item.group].uniqueMessages.push(item)
            if (item.params.length > 0) {
                groups[item.group].haveParams = true
            }
        }
        const groupNames = Object.keys(groups)

        let sourceCode = `
// ==================
// * Generated file *
// ==================`
        sourceCode += '\n\n'

        // base type
        sourceCode += 'export class UniqueMessagePrimitive {'
        sourceCode += groupNames
            .map((name) => `readonly ${caseCamel(name)} = new ${casePascal(name)}()`)
            .join('\n')
        sourceCode += '}\n'

        // base type with params
        sourceCode += 'export class UniqueMessageWithParams {'
        sourceCode += groupNames
            .map(
                (name) =>
                    `readonly ${caseCamel(name)}: ${casePascal(name)}${groups[name].haveParams ? 'WithParams' : ''}`
            )
            .join('\n')
        sourceCode += '\n\n'

        sourceCode += `constructor(private readonly base: UniqueMessagePrimitive) {`
        sourceCode += groupNames
            .map(
                (name) =>
                    `this.${caseCamel(name)} = ${groups[name].haveParams ? `new ${casePascal(name)}WithParams(base.${caseCamel(name)})` : `base.${caseCamel(name)}`}`
            )
            .join('\n')

        sourceCode += '}\n}\n\n'

        for (const groupName of groupNames) {
            const className = casePascal(groupName)
            sourceCode += `export class ${className} {`
            sourceCode += groups[groupName].uniqueMessages
                .map((uniqueMessage) => {
                    const comment = uniqueMessage.comment
                        ? `/**\n * @description ${uniqueMessage.comment.replaceAll('\n', '\n * ')}\n*/\n`
                        : ''
                    const value = uniqueMessage.value.replaceAll('\n', '\\n')
                    return `${comment}readonly ${caseCamel(uniqueMessage.key)} = '${value}'`
                })
                .join('\n')
            sourceCode += '}\n'

            if (groups[groupName].haveParams === false) {
                sourceCode += '\n'
                continue
            }

            // params
            sourceCode += `export class ${className}WithParams {\nconstructor(private readonly base: ${className}) {}\n`
            sourceCode += groups[groupName].uniqueMessages
                .map((uniqueMessage) => {
                    const value = uniqueMessage.value.replaceAll('\n', '\\n')
                    let result = `/**\n * @value: ${value}\n`
                    result += uniqueMessage.comment
                        ? ` * @description ${uniqueMessage.comment.replaceAll('\n', '\n * ')}\n`
                        : ''
                    result += ` */\n`

                    if (uniqueMessage.params.length === 0) {
                        result += `get ${uniqueMessage.key}(): string { return this.base.${uniqueMessage.key} }`
                    } else {
                        result += `${uniqueMessage.key}(args: {`
                        result += uniqueMessage.params
                            .map((param) => `${param.name}: ${param.type}`)
                            .join()
                        result += `}): string { return this.base.${uniqueMessage.key}\n`
                        result += uniqueMessage.params
                            .map(
                                (param) =>
                                    `.replaceAll('${param.name}', \`$\{args.${param.name}}\`)`
                            )
                            .join('\n')
                        result += '}'
                    }
                    return result
                })
                .join('\n')
            sourceCode += '}\n\n'
        }

        ensureDirectoryExistence(configUnique.resultSourceCodeFilePath)
        fs.writeFileSync(configUnique.resultSourceCodeFilePath, sourceCode, 'utf8')
        loading.stop(`Source code generated: ${chalk.blue(configUnique.resultSourceCodeFilePath)}`)
    }
}

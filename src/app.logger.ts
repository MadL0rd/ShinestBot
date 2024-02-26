import * as winston from 'winston'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as path from 'path'
import { internalConstants } from './app.internal-constants'
import { LoggerService } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https')

import * as chalk from 'chalk'

const baseDir = process.cwd()
const isWindows = process.platform === 'win32'

const timezoned = () => {
    return new Date().formattedWithAppTimeZone('YYYY-MM-DD HH:mm:ss')
}

enum SourceFileLayerType {
    nodeModule = 'node_modules',
    core = 'core',
    presentation = 'presentation',
    app = 'app',
    other = 'other',
}

function sourceFileLayerPrefix(layer: SourceFileLayerType): string {
    switch (layer) {
        case SourceFileLayerType.nodeModule:
            return '🧰'
        case SourceFileLayerType.core:
            return '🛠'
        case SourceFileLayerType.presentation:
            return '📝'
        case SourceFileLayerType.app:
            return '🍏'
    }
    return '❓'
}

class DebugLineInfo {
    readonly functionName: string
    readonly absoluteFilePath: string
    readonly relativeFilePath: string
    readonly fileName: string
    readonly lineNumber: number
    readonly linePosition: number
    readonly codeLayer: SourceFileLayerType

    /**
     * Returns a steck trace line
     * @example: MacOS: 'at GoogleTablesService.getContentByListName (/Users/.../src/core/google-tables/google-tables.service.ts:23:16)'
     * @example: MacOS: 'at /Users/.../src/presentation/scenes/implementations/bonus-content.scene.ts:34:60'
     * @example: Windows: 'at Logger.log (D:\\Projects\\Zabotchatbot\\node_modules\\@nestjs\\common\\services\\logger.service.js:49:29)'
     */
    constructor(stackTraceLine: string) {
        const lineComponents = stackTraceLine.trimmed.split(' ')
        let pathLineComponent = lineComponents[2]
        this.functionName = lineComponents[1]
        if (lineComponents.length === 2) {
            this.functionName = 'undefined'
            pathLineComponent = lineComponents[1]
        }

        let filePathStringComponents = pathLineComponent
            .replace('(', '')
            .replace(')', '')
            .split(':')
        if (isWindows) {
            filePathStringComponents[1] =
                filePathStringComponents[0] + ':' + filePathStringComponents[1]
            filePathStringComponents = filePathStringComponents.slice(1)
        }
        this.absoluteFilePath = filePathStringComponents.first ?? '* undefined file path *'
        this.relativeFilePath = this.absoluteFilePath.replace(baseDir, '.')
        if (!isWindows) {
            this.fileName = this.absoluteFilePath.split('/').last ?? '* undefined file name *'
        } else {
            this.fileName = this.absoluteFilePath.split('\\').last ?? '* undefined file name *'
        }
        this.lineNumber = Number(filePathStringComponents[1])
        this.linePosition = Number(filePathStringComponents[2])

        this.codeLayer = SourceFileLayerType.other
        if (this.relativeFilePath.includes('main.ts')) {
            this.codeLayer = SourceFileLayerType.app
        }
        for (const codeLayerKey in SourceFileLayerType) {
            // @ts-ignore: Unreachable code error
            const codeLayer = SourceFileLayerType[codeLayerKey]
            if (this.relativeFilePath.includes(codeLayer)) {
                this.codeLayer = codeLayer
                return
            }
        }
    }

    get relativeLineLink(): string {
        return `${this.relativeFilePath}:${this.lineNumber}:${this.linePosition}`
    }
}
/**
 * Returns a steck trace line
 * @param stackLevel: Call stack level; If null - use first from src
 */
function getDebugStackTraceInfo(stackTraceLevel: number | null = 3): DebugLineInfo {
    const error = new Error()
    const stackTraceLines = error.stack?.split('\n').map((line) => line.trimmed) ?? []
    if (stackTraceLevel && stackTraceLines[stackTraceLevel]) {
        const frame = stackTraceLines[stackTraceLevel]
        return new DebugLineInfo(frame)
    } else {
        const frames = stackTraceLines.filter(
            (line) => line.includes(baseDir) && line.includes('node_modules').isFalse
        )
        return new DebugLineInfo(frames.isEmpty ? stackTraceLines.last ?? '' : frames.last ?? '')
    }
}

const filesLogsFormat = winston.format.printf((logLineInfo) => {
    const levelCaption = logLineInfo.level.upperCased
    const timestamp = logLineInfo.timestamp
    const label = logLineInfo.label
    const link = logLineInfo.sourceCodeLink
    const message = logLineInfo.message
    const messagePrefix = sourceFileLayerPrefix(logLineInfo.sourceFileLayer)

    return `${levelCaption}\t${timestamp}\t${label}\t${link}\n${messagePrefix}\t${message}\n`
})

/**
 * ### Default
 * @function `log`(`message`: **string**, `context`: **any**)
 * - Next params will be ignored
 *
 * @function `error`(`message`: **string**, `stack`: **any**, `context`: **any**)
 * - `stack` param will be converted to `Array`
 * - Next params will be ignored
 *
 * ### Custom metadata
 *
 * @function `log`(`metadata`: **object**) and `error`(`metadata`: **object**)
 *
 * To use `metadata`:
 * - Add format `winston.format.metadata({ fillExcept: ['message', 'and', 'other', 'expected', 'keys'] })`
 * - Get expected keys inside `winston.format.printf` param `info`
 * @note
 * - Second param `context` will be placed in `info.metadata.context`
 * - Next params will be ignored
 */
const loggerWinston = WinstonModule.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }),
        winston.format.metadata({
            fillExcept: [
                'message',
                'level',
                'timestamp',
                'label',
                'sourceCodeLink',
                'sourceFileLayer',
            ],
        })
    ),
    transports: [
        // logging all level
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.printf((logLineInfo) => {
                    let levelCaption = logLineInfo.level.upperCased
                    switch (logLineInfo.level) {
                        case 'info':
                            levelCaption = chalk.green(levelCaption)
                        case 'warn':
                            levelCaption = chalk.bold.yellow(levelCaption)
                        case 'error':
                            levelCaption = chalk.bold.red(levelCaption)
                    }
                    const timestamp = chalk.blue(logLineInfo.timestamp)
                    const label = chalk.blue(`[ ${logLineInfo.label} ]`)
                    const link = chalk.blue(`${logLineInfo.sourceCodeLink}`)
                    const message = chalk.greenBright(logLineInfo.message)
                    const messagePrefix = sourceFileLayerPrefix(logLineInfo.sourceFileLayer)

                    return `${levelCaption}\t${timestamp}\t${label}\t${link}\n${messagePrefix}\t${message}\n`
                })
            ),
        }),
        new DailyRotateFile({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            filename: path.join(baseDir, '/logs/%DATE%/', 'logs.log'),
            format: winston.format.combine(filesLogsFormat, winston.format.errors({ stack: true })),
        }),
        new DailyRotateFile({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            filename: path.join(baseDir, '/logs/%DATE%/', 'error.log'),
            format: winston.format.combine(filesLogsFormat, winston.format.errors({ stack: true })),
        }),
    ],
})

export class DebugInformableLogger implements LoggerService {
    // =====================
    // Public methods
    // =====================

    log(message: any, ...optionalParams: any[]) {
        const debugLine = getDebugStackTraceInfo()
        loggerWinston.log(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )
    }

    debug?(message: any, ...optionalParams: any[]) {
        const debugLine = getDebugStackTraceInfo()
        loggerWinston.log(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )
    }

    verbose?(message: any, ...optionalParams: any[]) {
        const debugLine = getDebugStackTraceInfo()
        loggerWinston.log(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )
    }

    warn(message: any, ...optionalParams: any[]) {
        let debugLine = getDebugStackTraceInfo()

        const error: Error = optionalParams[0]
        if (error) {
            try {
                message = this.clipLogMessage(`Message: ${message}\nError: ${error}`)
                debugLine = this.getLineFromTrceback(message) ?? debugLine
            } catch (error) {
                loggerWinston.error('Logger error info convertation failed', error)
            }
        }

        loggerWinston.warn(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )
    }

    error(message: any, ...optionalParams: any[]) {
        let debugLine = getDebugStackTraceInfo()

        const error: Error = optionalParams[0]
        if (error) {
            try {
                message = this.clipLogMessage(`Message: ${message}\nError: ${error}`)
                debugLine = this.getLineFromTrceback(message) ?? debugLine
            } catch (error) {
                loggerWinston.error('Logger error info convertation failed', error)
            }
        }

        loggerWinston.error(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )

        this.sendErrorMessage(
            `🔴 Error 🔴\n${debugLine.functionName}\n${debugLine.relativeLineLink}\n\n\`\`\`\n${message}\n\`\`\``
        )
    }

    fatal(message: any, ...optionalParams: any[]) {
        let debugLine = getDebugStackTraceInfo()

        const error: Error = optionalParams[0]
        if (error) {
            try {
                message = this.clipLogMessage(`Message: ${message}\nError: ${error}`)
                debugLine = this.getLineFromTrceback(message) ?? debugLine
            } catch (error) {
                loggerWinston.error('Logger error info convertation failed', error)
            }
        }

        loggerWinston.error(
            {
                message: message,
                label: debugLine.functionName,
                sourceCodeLink: debugLine.relativeLineLink,
                sourceFileLayer: debugLine.codeLayer,
            },
            optionalParams
        )

        this.sendErrorMessage(
            `💀 Fatal error 💀\n${debugLine.functionName}\n${debugLine.relativeLineLink}\n\n\`\`\`\n${message}\n\`\`\``
        )
    }

    // =====================
    // Private methods
    // =====================

    private clipLogMessage(message: string, maxMessageLinesCount: number = 25): string {
        const messageLines = `${message}`.split('\n')
        if (messageLines.length <= maxMessageLinesCount) return message

        const maxHalf = Math.ceil(maxMessageLinesCount / 2)
        return [
            ...messageLines.slice(0, maxHalf),
            '\t🪚==========================🪚',
            '\t|| Clipped for readability ||',
            '\t🪚==========================🪚',
            ...messageLines.slice(messageLines.length - maxHalf, undefined),
        ].join('\n')
    }

    private getLineFromTrceback(logWithTraceback: string): DebugLineInfo | null {
        const tracebackLines = logWithTraceback
            .split('\n')
            .map((line) => line.trimmed)
            .filter((line) => line.startsWith('at ') && line.includes(baseDir))
        const targetLine =
            tracebackLines.filter((line) => line.includes('node_modules').isFalse).first ??
            tracebackLines.first
        return targetLine ? new DebugLineInfo(targetLine) : null
    }

    private sendErrorMessage(message: string) {
        if (!internalConstants.errorsChatId) return

        const postData = JSON.stringify({
            chat_id: internalConstants.errorsChatId,
            text: message,
            parse_mode: 'Markdown',
        })

        const options = {
            host: `api.telegram.org`,
            path: `/bot${internalConstants.botToken}/sendMessage`,
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
            },
        }

        try {
            // @ts-ignore: Unreachable code error
            const req = https.request(options, (res) => {
                console.log('Logger: error message statusCode:', res.statusCode)
                // console.log('headers:', res.headers)

                // res.on('data', (d) => {
                //     process.stdout.write(d)
                // })
            })

            // @ts-ignore: Unreachable code error
            req.on('error', (e) => {
                console.error(e)
            })

            req.write(postData)
            req.end()
        } catch (error) {
            loggerWinston.error(error)
        }
    }
}

export const logger = new DebugInformableLogger()

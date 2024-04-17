import * as winston from 'winston'
import chalk from 'chalk'
import * as path from 'path'
import DailyRotateFile from 'winston-daily-rotate-file'
import { WinstonModule } from 'nest-winston'
import { internalConstants } from '../app/app.internal-constants'
import { LoggerService } from '@nestjs/common'
import { DebugLineInfo, sourceFileLayerPrefix } from './debug-line-info.model'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https')

const baseDir = process.cwd()

const timezoned = () => {
    return new Date().formattedWithAppTimeZone('YYYY-MM-DD HH:mm:ss')
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
                            break
                        case 'warn':
                            levelCaption = chalk.bold.yellow(levelCaption)
                            break
                        case 'error':
                            levelCaption = chalk.bold.red(levelCaption)
                            break
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
        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
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
        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
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
        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
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
        let debugLine = DebugLineInfo.getDebugStackTraceInfo()

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
        let debugLine = DebugLineInfo.getDebugStackTraceInfo()

        const error: Error = optionalParams[0]
        if (error) {
            try {
                message = this.clipLogMessage(
                    `Message: ${message}\nError: ${error}`.replace('Error: Error:', 'Error:\t')
                )
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
        let debugLine = DebugLineInfo.getDebugStackTraceInfo()

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
            const req = https.request(options, (res: { statusCode: any }) => {
                console.log('Logger: error message statusCode:', res.statusCode)
                // console.log('headers:', res.headers)

                // res.on('data', (d) => {
                //     process.stdout.write(d)
                // })
            })

            req.on('error', (e: any) => {
                console.error(e)
            })

            req.write(postData)
            req.end()
        } catch (error) {
            loggerWinston.error(error)
        }
    }
}

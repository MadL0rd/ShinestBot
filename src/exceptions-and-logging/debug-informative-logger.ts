import { LoggerService } from '@nestjs/common'
import chalk from 'chalk'
import moment from 'moment'
import { WinstonModule } from 'nest-winston'
import * as path from 'path'
import { TelegramError } from 'telegraf'
import { inspect } from 'util'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import z, { ZodError } from 'zod'
import { DebugLineInfo, sourceFileLayerPrefix } from './debug-line-info.model'

const baseDir = process.cwd()

const dateFormatCurrentTimeZone = () => {
    const date = new Date()
    if (date.formattedWithAppTimeZone) return date.formattedWithAppTimeZone('YYYY-MM-DD HH:mm:ss')
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

const filesLogsFormat = winston.format.printf((logLineInfo) => {
    const levelCaption = logLineInfo.level.toUpperCase()
    const timestamp = logLineInfo.timestamp
    const label = logLineInfo.label
    const link = logLineInfo.sourceCodeLink
    const message = logLineInfo.message
    const messagePrefix = sourceFileLayerPrefix(logLineInfo.codeLayer)

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
        winston.format.timestamp({ format: dateFormatCurrentTimeZone }),
        winston.format.metadata({
            fillExcept: ['message', 'level', 'timestamp', 'label', 'sourceCodeLink', 'codeLayer'],
        })
    ),
    transports: [
        // logging all level
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.printf((logLineInfo) => {
                    let levelCaption = logLineInfo.level.toUpperCase()
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
                        default:
                            break
                    }
                    const timestamp = chalk.blue(logLineInfo.timestamp)
                    const label = chalk.blue(`[ ${logLineInfo.label} ]`)
                    const link = chalk.blue(`${logLineInfo.sourceCodeLink}`)
                    const message = chalk.greenBright(logLineInfo.message)
                    const messagePrefix = sourceFileLayerPrefix(logLineInfo.codeLayer)

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

export class DebugInformativeLogger implements LoggerService {
    // =====================
    // Public methods
    // =====================

    constructor(
        public telegram: {
            token: string
            chatId: number
            messageThreadId: number | undefined
        } | null = null
    ) {
        /**
         * Bind all logger methods to `this` so they can be safely used as callbacks,
         * e.g., Promise.reject('err').catch(this.error)
         */
        const logLevels = ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] as const
        for (const logLevel of logLevels) {
            this[logLevel] = this[logLevel].bind(this)
        }
    }

    log(...params: [any, ...any]) {
        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
        loggerWinston.log(
            {
                message: this.generateComplicatedLoggingMessage(params, ' ◀︎▶︎ '),
                label: debugLine.functionInfo,
                sourceCodeLink: debugLine.relativeLineLink,
                codeLayer: debugLine.codeLayer,
            },
            params
        )
    }

    debug(...params: [any, ...any]) {
        if (!loggerWinston.debug) return

        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
        loggerWinston.debug({
            message: this.generateComplicatedLoggingMessage(params, ' ◀︎▶︎ '),
            label: debugLine.functionInfo,
            sourceCodeLink: debugLine.relativeLineLink,
            codeLayer: debugLine.codeLayer,
        })
    }

    verbose(...params: [any, ...any]) {
        if (!loggerWinston.verbose) return

        const debugLine = DebugLineInfo.getDebugStackTraceInfo()
        loggerWinston.verbose(
            {
                message: this.generateComplicatedLoggingMessage(params, ' ◀︎▶︎ '),
                label: debugLine.functionInfo,
                sourceCodeLink: debugLine.relativeLineLink,
                codeLayer: debugLine.codeLayer,
            },
            params
        )
    }

    warn(...params: [any, ...any]) {
        const error = params.find((item) => item instanceof Error)
        const debugLine =
            this.getLineFromTraceback(error?.stack) ?? DebugLineInfo.getDebugStackTraceInfo()

        loggerWinston.warn(
            {
                message: this.generateComplicatedLoggingMessage(params),
                label: debugLine.functionInfo,
                sourceCodeLink: debugLine.relativeLineLink,
                codeLayer: debugLine.codeLayer,
            },
            params
        )
    }

    error(...params: [any, ...any]) {
        const error = params.find((item) => item instanceof Error)
        const debugLine =
            this.getLineFromTraceback(error?.stack) ?? DebugLineInfo.getDebugStackTraceInfo()
        const message = this.generateComplicatedLoggingMessage(params)

        loggerWinston.error(
            {
                message,
                label: debugLine.functionInfo,
                sourceCodeLink: debugLine.relativeLineLink,
                codeLayer: debugLine.codeLayer,
            },
            params
        )

        this.sendErrorMessageToTelegram({
            title: `🔴 Error 🔴\n${debugLine.functionInfo}\n${debugLine.relativeLineLink}`,
            codeBlock: message,
        })
    }

    fatal(...params: [any, ...any]) {
        const error = params.find((item) => item instanceof Error)
        const debugLine =
            this.getLineFromTraceback(error?.stack) ?? DebugLineInfo.getDebugStackTraceInfo()
        const message = this.generateComplicatedLoggingMessage(params)

        loggerWinston.error(
            {
                message: message,
                label: debugLine.functionInfo,
                sourceCodeLink: debugLine.relativeLineLink,
                codeLayer: debugLine.codeLayer,
            },
            params
        )

        this.sendErrorMessageToTelegram({
            title: `💀 Fatal error 💀\n${debugLine.functionInfo}\n${debugLine.relativeLineLink}`,
            codeBlock: message,
        })
    }

    // =====================
    // Private methods
    // =====================

    private generateComplicatedLoggingMessage(params: unknown[], separator: string = '\n'): string {
        return params
            .map((item) => {
                if (typeof item === 'string') return item
                if (item instanceof Error) {
                    if (!item.cause) return `Error: ${this.getErrorMessage(item)}`

                    let currentError: Error | null = item
                    const errorMessages: string[] = []

                    while (currentError) {
                        errorMessages.push(this.getErrorMessage(currentError))
                        currentError =
                            currentError.cause instanceof Error ? currentError.cause : null
                    }
                    return `Error: ${errorMessages.join('\n▲ Cause ▲\n')}`
                }
                return inspect(item)
            })
            .join(separator)
    }

    private getErrorMessage(error: Error): string {
        if (error instanceof ZodError) {
            return z.prettifyError(error)
        }
        if (error instanceof TelegramError) {
            let method = 'method' in error.on ? error.on.method : null
            let mediaTypes = ''
            let mediaSourcesInfo = ''

            if (method && 'payload' in error.on) {
                const payload = error.on.payload as any

                if (
                    method === 'sendMediaGroup' ||
                    error.description.toLowerCase().includes('wrong file identifier')
                ) {
                    let mediaSources: unknown[] = []
                    switch (method) {
                        case 'sendMediaGroup':
                            mediaTypes = payload?.media
                                ?.map((item: any) => item?.type)
                                .filter(Boolean)
                                .join(',')
                            payload?.media?.forEach((item: any) => mediaSources.push(item?.media))
                            break

                        case 'sendPhoto':
                            mediaSources.push(payload?.photo)
                            break

                        case 'sendVideo':
                            mediaSources.push(payload?.video)
                            break

                        case 'sendVideoNote':
                            mediaSources.push(payload?.video_note)
                            break

                        case 'sendVoice':
                            mediaSources.push(payload?.voice)
                            break

                        case 'sendAudio':
                            mediaSources.push(payload?.audio)
                            break

                        case 'sendDocument':
                            mediaSources.push(payload?.document)
                            break

                        case 'sendAnimation':
                            mediaSources.push(payload?.animation)
                            break

                        case 'sendSticker':
                            mediaSources.push(payload?.sticker)
                            break

                        default:
                            break
                    }

                    mediaSources = mediaSources.filter(Boolean)
                    mediaSourcesInfo = mediaSources.isNotEmpty ? JSON.stringify(mediaSources) : ''
                }
            }

            if (mediaTypes) method += `:${mediaTypes}`
            let result = method ? `[${method}] ${error.message}` : error.message
            if (mediaSourcesInfo) {
                result += `\n ▲ Media: ${mediaSourcesInfo}`
            }

            return result
        }
        if (error instanceof AggregateError) {
            const prefix = ' ✸ '
            const suffix = ''
            const separator = `${suffix}\n${prefix}`
            return `[AggregateError] ${error.message}\n[\n${prefix}${this.generateComplicatedLoggingMessage(error.errors, separator)}${suffix}\n]`
        }
        return error.message
    }

    private getLineFromTraceback(logWithTraceback: unknown): DebugLineInfo | null {
        if (typeof logWithTraceback !== 'string') return null

        const tracebackLines = logWithTraceback
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && line.startsWith('at ') && line.includes(baseDir))
        const targetLine =
            tracebackLines.find((line) => line.includes('node_modules') === false) ??
            tracebackLines[0]

        return targetLine ? new DebugLineInfo(targetLine) : null
    }

    private sendErrorMessageToTelegram(args: { title: string; codeBlock: string }) {
        if (!this.telegram) return

        const title = `${args.title}\n\n`
        let body = `\`\`\`\n${args.codeBlock}\n\`\`\``
        const maxMessageLength = 4096
        if (title.length + body.length > maxMessageLength) {
            const clippedPlaceholder = [
                '🪚==========================🪚',
                '|| Clipped for readability ||',
                '🪚==========================🪚',
            ].join('\n')
            body = [
                `\`\`\``,
                args.codeBlock.slice(
                    0,
                    maxMessageLength - title.length - clippedPlaceholder.length - 16
                ),
                clippedPlaceholder,
                `\`\`\``,
            ].join('\n')
        }

        fetch(`https://api.telegram.org/bot${this.telegram.token}/sendMessage`, {
            method: 'POST',
            headers: {
                'User-Agent': 'undici-stream-example',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: this.telegram.chatId,
                message_thread_id: this.telegram.messageThreadId,
                text: title + body,
                parse_mode: 'Markdown',
            }),
        })
            .then((result) => {
                if (result.status === 200) return
                result.json().then((data) => {
                    loggerWinston.error(`Logger: error message sending fails\n${inspect(data)}`)
                })
            })
            .catch((error) => {
                loggerWinston.error('Logger: error message sending fails', error)
            })
    }
}

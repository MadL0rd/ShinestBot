namespace SourceFileLayerType {
    export type Union = (typeof allCases)[number]
    export const allCases = ['node_modules', 'core', 'presentation', 'app', 'other'] as const

    export const emoji: Record<Union, string> = {
        node_modules: '🧰',
        core: '🛠',
        presentation: '📝',
        app: '🍏',
        other: '❓',
    }

    export function getByFilePath(filePath: string): Union {
        if (filePath.includes('main.ts')) return 'app'

        for (const value of allCases) {
            if (filePath.includes(value)) return value
        }
        return 'other'
    }
}

export class DebugLineInfo {
    static get isWindows(): boolean {
        return process.platform === 'win32'
    }
    static readonly baseDir = process.cwd()

    readonly functionInfo: string
    readonly absoluteFilePath: string
    readonly relativeFilePath: string
    readonly fileName: string
    readonly lineNumber: number
    readonly linePosition: number
    readonly codeLayer: SourceFileLayerType.Union
    readonly codeLayerPrefix: string

    /**
     * Returns a stack trace line
     * @example: MacOS: 'at GoogleTablesService.getContentByListName (/Users/.../src/core/google-tables/google-tables.service.ts:23:16)'
     * @example: MacOS: 'at /Users/.../src/presentation/scenes/implementations/bonus-content.scene.ts:34:60'
     * @example: Windows: 'at Logger.log (D:\\Projects\\...\\node_modules\\@nestjs\\common\\services\\logger.service.js:49:29)'
     */
    constructor(stackTraceLine: string) {
        const info = DebugLineInfo.parseStackTraceLine(stackTraceLine)

        this.functionInfo = info.functionInfo ?? ''
        this.absoluteFilePath = info.filePath ?? '* undefined file path *'
        this.relativeFilePath = this.absoluteFilePath.replace(DebugLineInfo.baseDir, '.')

        const pathParts = this.absoluteFilePath.split(!DebugLineInfo.isWindows ? '\\' : '/')
        this.fileName = pathParts[pathParts.length - 1] ?? '* undefined file name *'

        this.lineNumber = Number(info.lineNumber)
        this.linePosition = Number(info.linePosition)

        this.codeLayer = SourceFileLayerType.getByFilePath(this.relativeFilePath)
        this.codeLayerPrefix = SourceFileLayerType.emoji[this.codeLayer]
    }

    get relativeLineLink(): string {
        return `${this.relativeFilePath}:${this.lineNumber}:${this.linePosition}`
    }

    /**
     * Returns a stack trace line
     * @param stackLevel: Call stack level; If null - use first from src
     */
    static getDebugStackTraceInfo(stackTraceLevel: number | null = 3): DebugLineInfo {
        const error: { stack?: string | undefined } = {}
        Error.captureStackTrace(error)

        const stackTraceLines = error.stack?.split('\n').map((line) => line.trim()) ?? []
        if (stackTraceLevel && stackTraceLines[stackTraceLevel]) {
            const frame = stackTraceLines[stackTraceLevel]
            return new DebugLineInfo(frame)
        } else {
            const frames = stackTraceLines.filter((line) => {
                console.log(line)

                return (
                    line.includes(DebugLineInfo.baseDir) && line.includes('node_modules') === false
                )
            })
            return new DebugLineInfo(
                frames[frames.length - 1] ?? stackTraceLines[stackTraceLines.length - 1]
            )
        }
    }

    static parseStackTraceLine(stackTraceLine: string): {
        functionInfo?: string
        filePath?: string
        lineNumber?: string
        linePosition?: string
    } {
        if (typeof stackTraceLine !== 'string') return {}
        const regex =
            /^\s*at\s+(?:(?<functionInfo>.+?) \((?<filePath1>.+):(?<line1>\d+):(?<col1>\d+)\)|(?<filePath2>.+):(?<line2>\d+):(?<col2>\d+))$/

        const match = stackTraceLine.match(regex)
        if (!match || !match.groups) return {}
        return {
            functionInfo: match.groups.functionInfo || undefined,
            filePath: match.groups.filePath1 || match.groups.filePath2,
            lineNumber: match.groups.line1 || match.groups.line2,
            linePosition: match.groups.col1 || match.groups.col2,
        }
    }
}

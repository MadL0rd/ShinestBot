export enum SourceFileLayerType {
    nodeModule = 'node_modules',
    core = 'core',
    presentation = 'presentation',
    app = 'app',
    other = 'other',
}

export function sourceFileLayerPrefix(layer: SourceFileLayerType): string {
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

export class DebugLineInfo {
    static get isWindows(): boolean {
        return process.platform === 'win32'
    }
    static readonly baseDir = process.cwd()

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
        if (DebugLineInfo.isWindows) {
            filePathStringComponents[1] =
                filePathStringComponents[0] + ':' + filePathStringComponents[1]
            filePathStringComponents = filePathStringComponents.slice(1)
        }
        this.absoluteFilePath = filePathStringComponents.first ?? '* undefined file path *'
        this.relativeFilePath = this.absoluteFilePath.replace(DebugLineInfo.baseDir, '.')
        if (!DebugLineInfo.isWindows) {
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
            const key = codeLayerKey as keyof typeof SourceFileLayerType
            const codeLayer = SourceFileLayerType[key]
            if (this.relativeFilePath.includes(codeLayer)) {
                this.codeLayer = codeLayer
                return
            }
        }
    }

    get relativeLineLink(): string {
        return `${this.relativeFilePath}:${this.lineNumber}:${this.linePosition}`
    }

    /**
     * Returns a steck trace line
     * @param stackLevel: Call stack level; If null - use first from src
     */
    static getDebugStackTraceInfo(stackTraceLevel: number | null = 3): DebugLineInfo {
        const error = new Error()
        const stackTraceLines = error.stack?.split('\n').map((line) => line.trimmed) ?? []
        if (stackTraceLevel && stackTraceLines[stackTraceLevel]) {
            const frame = stackTraceLines[stackTraceLevel]
            return new DebugLineInfo(frame)
        } else {
            const frames = stackTraceLines.filter(
                (line) =>
                    line.includes(DebugLineInfo.baseDir) && line.includes('node_modules').isFalse
            )
            return new DebugLineInfo(
                frames.isEmpty ? stackTraceLines.last ?? '' : frames.last ?? ''
            )
        }
    }
}

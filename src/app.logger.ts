import { Logger } from '@nestjs/common'

export const logger = new Logger()

/*function getDetailsFromFile(fileDetails: any) {
    const fileAndRow = fileDetails.split('at ').pop().split('(').pop().replace(')', '').split(':')

    const detailsFromFile = {
        file: fileAndRow[0].trim(),
        line: fileAndRow[1],
        row: fileAndRow[2],
    }
    return `File: ${detailsFromFile.file} -- ${detailsFromFile.line}:${detailsFromFile.row}`
}

export function formatLogger(info: any) {
    if (info.context.length === 2) {
        return `[Nest] 5277   - ${[info.timestamp]}  [${info.context[0]}] :  ${info.level}: ${
            info.message
        } -- ${getDetailsFromFile(info.context[1])}`
    }
    return `[Nest] 5277   - ${[info.timestamp]}  [${info.context}] :  ${info.level}: ${
        info.message
    }`
}*/

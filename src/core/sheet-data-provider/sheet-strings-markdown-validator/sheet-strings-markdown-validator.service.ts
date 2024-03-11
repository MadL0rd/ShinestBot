import { Injectable } from '@nestjs/common'
import {
    replaceMarkdownWithHtml,
    validateStringHtmlTagsAll,
} from 'src/utils/replaceMarkdownWithHtml'

@Injectable()
export class SheetStringsMarkdownValidatorService {
    validateAndUpdateRows(rows: string[][]): string[][] {
        // Markdown telegram specific symbols fix
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let cellValue = rows[i][j]
                if (cellValue) {
                    cellValue = replaceMarkdownWithHtml(cellValue).trimmed
                    validateStringHtmlTagsAll(cellValue)
                    rows[i][j] = cellValue
                }
            }
        }
        return rows
    }
}

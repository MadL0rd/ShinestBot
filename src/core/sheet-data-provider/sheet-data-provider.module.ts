import { Module } from '@nestjs/common'
import { GoogleSpreadsheetProviderService } from './providers/google-spreadsheet-provider/google-spreadsheet-provider.service'
import { LocalXlsxProviderService } from './providers/local-xlsx-provider/local-xlsx-provider.service'
import { SheetDataProviderFactoryService } from './sheet-data-provider-factory/sheet-data-provider-factory.service'
import { GoogleSpreadsheetCredentialsService } from './providers/google-spreadsheet-provider/google-spreadsheet-credentials.service'
import { SheetStringsMarkdownValidatorService } from './sheet-strings-markdown-validator/sheet-strings-markdown-validator.service'
import { SheetDataProviderService } from './sheet-data-provider.service'

@Module({
    providers: [
        GoogleSpreadsheetProviderService,
        LocalXlsxProviderService,
        SheetDataProviderFactoryService,
        GoogleSpreadsheetCredentialsService,
        SheetStringsMarkdownValidatorService,
        SheetDataProviderService,
    ],
    exports: [SheetDataProviderService],
})
export class SheetDataProviderModule {}

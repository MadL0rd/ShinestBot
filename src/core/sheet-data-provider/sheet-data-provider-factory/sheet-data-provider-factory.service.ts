import { Injectable } from '@nestjs/common'
import { GoogleSpreadsheetProviderService } from '../providers/google-spreadsheet-provider/google-spreadsheet-provider.service'
import { ISheetDataProvider } from '../abscract/sheet-data-provider.interface'
import { LocalXlsxProviderService } from '../providers/local-xlsx-provider/local-xlsx-provider.service'

type SheetDataProvides = 'googleSpreadsheet' | 'localXlsx'

@Injectable()
export class SheetDataProviderFactoryService {
    constructor(
        private readonly googleSpreadsheetProvider: GoogleSpreadsheetProviderService,
        private readonly localXlsxProvider: LocalXlsxProviderService
    ) {}

    getDefaultProvider(): ISheetDataProvider {
        return this.getProvider('googleSpreadsheet')
    }

    getProvider(type: SheetDataProvides): ISheetDataProvider {
        switch (type) {
            case 'googleSpreadsheet':
                return this.googleSpreadsheetProvider
            case 'localXlsx':
                return this.localXlsxProvider
        }
    }
}

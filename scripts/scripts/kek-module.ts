import { SheetDataProviderModule } from '../../src/core/sheet-data-provider/sheet-data-provider.module'

import { Module } from '@nestjs/common'
import { KekCommand } from './kek-command'

@Module({
    imports: [SheetDataProviderModule],
    controllers: [],
    providers: [KekCommand],
    exports: [KekCommand],
})
export class KekModule {}

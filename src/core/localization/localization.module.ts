import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LocalizationService } from './localization.service'
import { LocalizedGroup, LocalizedationSchema } from './schemas/localization.schema'
import { SheetDataProviderModule } from '../sheet-data-provider/sheet-data-provider.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: LocalizedGroup.name,
                schema: LocalizedationSchema,
            },
        ]),
        SheetDataProviderModule,
    ],
    providers: [LocalizationService],
    exports: [LocalizationService],
})
export class LocalizationModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LocalizationService } from './localization.service'
import { LocalizedGroupSchema, localizedGroupSchema } from './schemas/localization.schema'
import { SheetDataProviderModule } from '../sheet-data-provider/sheet-data-provider.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: LocalizedGroupSchema.name,
                schema: localizedGroupSchema,
            },
        ]),
        SheetDataProviderModule,
    ],
    providers: [LocalizationService],
    exports: [LocalizationService],
})
export class LocalizationModule {}

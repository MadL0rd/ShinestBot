import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LocalizationService } from './localization.service'
import { LocalizedGroup, LocalizedationSchema } from './schemas/localization.schema'
import { GoogleTablesModule } from '../google-tables/google-tables.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: LocalizedGroup.name,
                schema: LocalizedationSchema,
            },
        ]),
        GoogleTablesModule,
    ],
    providers: [LocalizationService],
    exports: [LocalizationService],
})
export class LocalizationModule {}

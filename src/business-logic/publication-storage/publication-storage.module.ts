import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PublicationStorageService } from './publication-storage.service'
import { Publication, PublicationSchema } from './schemas/publication.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Publication.name,
                schema: PublicationSchema,
            },
        ]),
    ],
    providers: [PublicationStorageService],
    exports: [PublicationStorageService],
})
export class PublicationStorageModule {}

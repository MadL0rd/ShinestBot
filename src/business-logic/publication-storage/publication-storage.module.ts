import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PublicationStorageService } from './publication-storage.service'
import { PublicationSchema, publicationSchema } from './schemas/publication.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: PublicationSchema.name,
                schema: publicationSchema,
            },
        ]),
    ],
    providers: [PublicationStorageService],
    exports: [PublicationStorageService],
})
export class PublicationStorageModule {}

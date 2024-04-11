import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Publication, PublicationDocument } from './schemas/publication.schema'
import { PublicationCreateDto, PublicationUpdateDto } from './dto/publication.dto'
import { PublicationEntity } from 'src/entities/publication'

@Injectable()
export class PublicationStorageService {
    constructor(@InjectModel(Publication.name) private model: Model<Publication>) {}

    async create(createDto: PublicationCreateDto): Promise<PublicationDocument> {
        return this.model.create(createDto)
    }

    async update(
        _id: string,
        updateDto: PublicationUpdateDto
    ): Promise<PublicationDocument | null> {
        return this.model
            .findOneAndUpdate({ _id: _id }, updateDto, {
                new: true,
            })
            .exec()
    }

    async findById(_id: string): Promise<PublicationDocument | null> {
        return await this.model.findById(_id).exec()
    }

    async findByRepliedMessageThreadId(
        threadMessageId: number
    ): Promise<PublicationDocument | null> {
        return await this.model
            .findOne({
                moderationChatThreadMessageId: threadMessageId,
            })
            .exec()
    }

    async findAllActivePublicationIds(skip: number = 0, limit: number = 1): Promise<string[]> {
        const statusActive: PublicationEntity.PublicationStatus.Union = 'active'
        const result = await this.model
            .find(
                // Filter
                { status: statusActive },
                // Projection
                {
                    _id: 1, // By default
                },
                { skip: skip, limit: limit }
            )
            .exec()
        return result.map((publication) => `${publication._id}`)
    }
}

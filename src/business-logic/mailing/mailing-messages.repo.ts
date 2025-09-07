import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MailingMessageCreateDto } from './dto/mailing-message.dto'
import { MailingMessageDocument, MailingMessageSchema } from './schemas/mailing-message.schema'

@Injectable()
export class MailingMessagesRepository {
    constructor(
        @InjectModel(MailingMessageSchema.name)
        private readonly model: Model<MailingMessageDocument>
    ) {}

    // =====================
    // Db interaction methods
    // =====================

    async create(dto: MailingMessageCreateDto): Promise<MailingMessageDocument> {
        dto.expireAt = dto.expireAt ?? Date.new().shift(2, 'weeks')
        const result = await this.model.create(dto)
        return result.toJSON()
    }

    async findOneById(id: string): Promise<MailingMessageDocument | null> {
        return this.model.findById(id).then((doc) => {
            return doc?.toJSON() ?? null
        })
    }

    async findAll() {
        return this.model.find({ expireAt: { $gt: Date.new() } }).then((docs) =>
            docs.map((doc) => {
                return doc.toJSON()
            })
        )
    }
}

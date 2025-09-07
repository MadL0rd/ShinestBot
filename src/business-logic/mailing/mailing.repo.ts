import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { pickFields } from 'src/utils/pick-fields'
import { MailingCreateDto, MailingDocument, MailingSchema } from './schemas/mailings.schema'

@Injectable()
export class MailingRepository {
    constructor(
        @InjectModel(MailingSchema.name)
        private readonly model: Model<MailingDocument>
    ) {}

    async create(dto: MailingCreateDto): Promise<MailingDocument> {
        const result = await this.model.create({ issued: false, ...dto })
        return result.toJSON()
    }

    async findOneById(id: string): Promise<MailingDocument | null> {
        return this.model.findById(id).then((doc) => {
            return doc?.toJSON() ?? null
        })
    }

    async findAllActive() {
        return this.model.find({ state: { $ne: 'completed' }, issued: false }).then((docs) =>
            docs.map((doc) => {
                return doc.toJSON()
            })
        )
    }

    async update<UpdateDto extends Partial<MailingDocument> & Pick<MailingDocument, 'id'>>(
        updateDto: UpdateDto,
        updateOnly?: (keyof Omit<UpdateDto, 'id'>)[]
    ): Promise<MailingDocument | null> {
        const dto = updateOnly ? pickFields(updateDto, updateOnly) : updateDto
        return this.model.findOneAndUpdate({ _id: updateDto.id }, dto).then((doc) => {
            return doc?.toJSON() ?? null
        })
    }
}

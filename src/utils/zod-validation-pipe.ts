import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from '@nestjs/common'
import { ZodSchema } from 'zod'

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: unknown, metadata: ArgumentMetadata) {
        const result = this.schema.safeParse(value)
        if (result.success) return result.data

        throw new HttpException(
            {
                status: HttpStatus.BAD_REQUEST,
                success: false,
                error: result.error,
            },
            HttpStatus.BAD_REQUEST
        )
    }
}

import z from 'zod'

export const stringDateSchema = z
    .any()
    .refine((value) => isNaN(value) || value instanceof Date, {
        message: `The date type must be a string with format 'YYYY-MM-DDTHH:mm:ss.sssZ', but not a number.`,
    })
    .pipe(z.coerce.date())

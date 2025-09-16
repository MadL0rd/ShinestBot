import z from 'zod'

export function formatPhoneNumber(phoneNumber: string): string {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '').replace(/\D/g, '')
    return phoneNumber.startsWith('8')
        ? phoneNumber.replace('8', '+7')
        : phoneNumber.startsWith('7')
          ? phoneNumber.replace('7', '+7')
          : phoneNumber
}

export const phoneNumberSchema = z
    .string()
    .min(1)
    .transform((phone) => {
        return formatPhoneNumber(phone)
    })
    .pipe(z.string().regex(/^(?:\+7|7|8)\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/))

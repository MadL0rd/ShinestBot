import { UserProfileSchema } from '../schemas/user.schema'

export type CreateUserDto = Pick<
    UserProfileSchema,
    'telegramId' | 'telegramInfo' | 'startParam' | 'startParamString'
>

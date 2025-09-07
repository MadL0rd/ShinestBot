import { UserProfile } from 'src/entities/user-profile'

export type UpdateUserDto = Partial<UserProfile.BaseType> & { telegramId: number }

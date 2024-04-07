import { UserInternalInfo } from '../../../entities/user-profile/nested/user.internal-info'
import { SceneData, TelegramInfo } from '../../../entities/user-profile/user-profile.entity'

export class CreateUserDto {
    readonly telegramId: number
    readonly telegramInfo: TelegramInfo
    readonly sceneData?: SceneData
    readonly internalInfo: UserInternalInfo
}

import { UserInternalInfo } from '../schemas/models/user.internal-info'
import { SceneData, TelegramInfo } from '../schemas/user.schema'

export class CreateUserDto {
    readonly telegramId: number
    readonly telegramInfo: TelegramInfo
    readonly sceneData?: SceneData
    readonly internalInfo?: UserInternalInfo
}

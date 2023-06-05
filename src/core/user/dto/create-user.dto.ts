import { SceneData, TelegramInfo, UserHistoryRecord, UserInternalInfo } from '../schemas/user.schema'

export class CreateUserDto {
    readonly telegramId: number
    readonly telegramInfo: TelegramInfo
    readonly sceneData?: SceneData
    readonly internalInfo?: UserInternalInfo
}

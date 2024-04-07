import { UserHistoryEvent } from '../../business-logic/user/enums/user-history-event.enum'
import { UserInternalInfo } from './nested/user.internal-info'

export type UserProfile = {
    telegramId: number
    telegramInfo: TelegramInfo
    sceneData: SceneData
    internalInfo: UserInternalInfo
    userHistory: UserHistoryRecord[]
}

export class TelegramInfo {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

export class SceneData {
    sceneName?: string
    data?: object
}

export class UserHistoryRecord {
    timeStamp: Date
    event: UserHistoryEvent
    content?: object | string
}

import { BotContentStable } from 'src/core/bot-content/schemas/bot-content.schema'
import { UserPermissionNames } from 'src/core/user/enums/user-permission-names.enum'
import { UserDocument } from 'src/core/user/schemas/user.schema'

export interface TransactionUserData {
    user: UserDocument
    userActivePermissions: UserPermissionNames.union[]
    userLanguage: string
    botContent: BotContentStable
}

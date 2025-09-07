import { Injectable } from '@nestjs/common'
import { logger } from 'src/app/app.logger'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserProfile } from 'src/entities/user-profile'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'
import { Update } from 'telegraf/types'

@Injectable()
export class UserSupportService {
    constructor(private readonly chainTasksService: ChainTasksService) {}

    async handleSupportRequest(args: {
        user: UserProfile.BaseType
        ctx?: ExtendedMessageContext | Context<Update.CallbackQueryUpdate> | null
        sourceType: string
    }) {
        logger.log(`Support feature is disabled`)
    }
}

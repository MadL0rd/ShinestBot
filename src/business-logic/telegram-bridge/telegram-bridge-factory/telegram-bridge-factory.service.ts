import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserService } from 'src/business-logic/user/user.service'
import { Telegraf } from 'telegraf'
import { TelegramDirectDialogInteractor } from '../telegram-ddi/telegram-ddi'

@Injectable()
export class TelegramBridgeFactoryService {
    constructor(
        @InjectBot('Bot') private readonly mainBot: Telegraf,
        private readonly userService: UserService,
        private readonly chainTasksService: ChainTasksService
    ) {}

    generateDdi(args: { userTelegramId: number; actorTelegramId?: number }) {
        return new TelegramDirectDialogInteractor({
            userTelegramId: args.userTelegramId,
            bot: this.mainBot,
            userService: this.userService,
            chainTasksService: this.chainTasksService,
        })
    }
}

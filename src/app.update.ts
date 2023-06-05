import { AppService } from './app.service'
import { Action, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf'
import { Telegraf, Context, Markup } from 'telegraf'
import { actionButtons } from './app.buttons'
import { GoogleTablesService } from './core/google-tables/google-tables.service'
import { PageNameEnum } from './core/google-tables/enums/page-name.enum'
import { UserService } from './core/user/user.service'
import { BotContentService } from './core/bot-content/bot-content.service'
import { IDispatcher } from './presentation/dispatcher/dispatcher.interface'
import { PrivateDialogDispatcher } from './presentation/dispatcher/private-dialog-dispatcher/private-dialog-dispatcher.service'
import { Message } from 'typegram'
import { logger } from './app.logger'

@Update()
export class AppUpdate {
    // =====================
    // Properties
    // =====================
    private readonly privateDialogDispatcher: IDispatcher

    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly appService: AppService,
        private readonly botContentService: BotContentService,
        private readonly userService: UserService
    ) {
        this.privateDialogDispatcher = new PrivateDialogDispatcher(
            this.botContentService,
            this.userService
        )
    }

    // =====================
    // Methods
    // =====================

    @Start()
    async startCommand(ctx: Context) {
        // await this.botContentService.cacheAll()
        logger.log(`User ${ctx.from.id} ${ctx.from.first_name} has started the bot`)
        await this.privateDialogDispatcher.handleUserStart(ctx)
    }

    @On(
        'text' ||
            'audio' ||
            'document' ||
            'photo' ||
            'sticker' ||
            'video' ||
            'voice' ||
            'video_note' ||
            'contact' ||
            'location' ||
            'venue' ||
            'invoice'
    )
    async on(ctx: Context) {
        const message = ctx.message as Message.TextMessage
        if (message) {
            logger.log(
                `User ${ctx.from.id} ${ctx.from.first_name} has sent a message: "${message.text}"`
            )
        } else {
            logger.log(`From ${ctx.from.id} ${ctx.from.first_name} receive`, ctx.message)
        }

        if (ctx.chat.type === 'private') {
            // Message from private chat with user
            await this.privateDialogDispatcher.handleUserMessage(ctx)
        } else if (ctx.from.first_name == 'Telegram') {
            // Fetch automatic telegram message for channel order from bot
            // TODO: implement admin group
        }
    }
}

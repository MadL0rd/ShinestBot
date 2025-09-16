import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { StartParam } from 'src/entities/start-param'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Telegraf } from 'telegraf'

type HandleResult = {
    abortNextHandling: boolean
}

@Injectable()
export class StartCommandHandlerService {
    private readonly completion = {
        continue: { abortNextHandling: false },
        abort: { abortNextHandling: true },
    } satisfies Record<string, HandleResult>

    constructor(
        @InjectBot('Bot') private readonly bot: Telegraf<Context>,
        private readonly userService: UserService
    ) {}

    async handleStartJustCreatedUser(ctx: ExtendedMessageContext, user: UserProfileDocument) {
        const startParam = user.startParam

        this.userService.logToUserHistory(user, {
            type: 'start',
            startParamString: user.startParamString ?? null,
            startParam: startParam ?? null,
        })
    }

    async handleStart(
        ctx: ExtendedMessageContext,
        user: UserProfileDocument
    ): Promise<HandleResult> {
        const message = ctx.message.type === 'text' ? ctx.message : undefined
        const startParamString =
            message?.entities?.first?.type === 'bot_command' ? message.text.split(' ')[1] : null
        const startParam = StartParam.Helper.parse(startParamString)

        this.userService.logToUserHistory(user, {
            type: 'start',
            startParamString: startParamString,
            startParam: startParam ?? null,
        })

        return this.completion.continue
    }
}

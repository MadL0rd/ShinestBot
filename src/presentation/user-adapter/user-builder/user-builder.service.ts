import { Injectable } from '@nestjs/common'
import { InjectBot } from 'nestjs-telegraf'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { StartParam } from 'src/entities/start-param'
import { UserProfile } from 'src/entities/user-profile'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

type GetProfileResult = {
    user: UserProfileDocument
    justCreated: boolean
}

type TelegramUpdateContext =
    | ExtendedMessageContext
    | Context<Update.CallbackQueryUpdate>
    | Context<Update.MyChatMemberUpdate>

@Injectable()
export class UserBuilderService {
    constructor(
        @InjectBot('Bot') private readonly bot: Telegraf<Context>,
        private readonly userService: UserService,
        private readonly chainTasksService: ChainTasksService
    ) {}

    async getUserProfile(ctx: TelegramUpdateContext): Promise<GetProfileResult> {
        if (!ctx.from) throw Error(`Founded ctx without sender\nCtx: ${JSON.stringify(ctx)}`)

        let justCreated = false
        let user = await this.userService.findOneByTelegramId(ctx.from.id)
        if (!user) {
            justCreated = true
            user = await this.createUserProfile(ctx)

            if (!user) {
                const tgUserInfo = JSON.stringify(ctx.from, null, 2)
                throw Error(`Cannot create user profile with id ${tgUserInfo}`)
            }
        } else if (user.enableStartParamRewriting === true) {
            const startParamInfo = await this.parseStartParamInfo(ctx)
            if (startParamInfo) {
                user.startParam = startParamInfo.startParam
                user.startParamString = startParamInfo.startParamString
                await this.userService.update(user, ['startParam', 'startParamString'])
            }
        }

        await this.updateUserTopicIfNeeded(user)

        return { user: user, justCreated: justCreated }
    }

    private async updateUserTopicIfNeeded(
        user: UserProfileDocument
    ): Promise<UserProfileDocument | null> {
        if (
            !user.telegramTopic ||
            user.telegramTopic.topicId !== UserProfile.TelegramTopic.activeIdByType.default
        ) {
            await this.chainTasksService.addTasks({
                onlyIfSameDoesNotExists: true,
                tasks: [
                    {
                        userTelegramId: user.telegramId,
                        action: {
                            resourceType: 'telegram',
                            actionType: 'createTopic',
                            topicType: 'default',
                        },
                    },
                    {
                        userTelegramId: user.telegramId,
                        action: {
                            resourceType: 'telegram',
                            actionType: 'sendTopicChangeLogs',
                        },
                    },
                ],
            })
        }
        return user
    }

    private async parseStartParamInfo(
        ctx: TelegramUpdateContext
    ): Promise<{ startParam: StartParam.BaseType | null; startParamString: string | null } | null> {
        if (!ctx.from) throw Error(`Founded ctx without sender\nCtx: ${JSON.stringify(ctx)}`)

        const message = ctx.message?.type === 'text' ? ctx.message : undefined
        const isBotCommand = message?.entities?.first?.type === 'bot_command'
        const isStartCommand = isBotCommand ? message.text.split(' ')[0] === '/start' : false
        if (isStartCommand === false || !message) {
            return null
        }

        const startParamString = message.text.split(' ')[1]
        const startParam = StartParam.Helper.parse(startParamString)

        return {
            startParam: startParam ?? null,
            startParamString: startParamString ?? null,
        }
    }

    private async createUserProfile(ctx: TelegramUpdateContext): Promise<UserProfileDocument> {
        if (!ctx.from) throw Error(`Founded ctx without sender\nCtx: ${JSON.stringify(ctx)}`)

        const startParamInfo = await this.parseStartParamInfo(ctx)

        return await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            startParam: startParamInfo?.startParam ?? null,
            startParamString: startParamInfo?.startParamString ?? null,
        })
    }
}

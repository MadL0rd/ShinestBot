import { Injectable } from '@nestjs/common'
import { UserService } from '../../business-logic/user/user.service'
import { UserProfileDocument } from '../../business-logic/user/schemas/user.schema'
import { logger } from 'src/app/app.logger'
import { Context, Telegraf } from 'telegraf'
import { Message, Update } from 'telegraf/types'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { UserProfile } from 'src/entities/user-profile'

@Injectable()
export class UserBuilderService {
    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly userService: UserService
    ) {}

    async getUserProfile(
        ctx: Context | Context<Update.CallbackQueryUpdate>
    ): Promise<UserProfileDocument> {
        if (!ctx.from) throw Error(`Founded ctx without sender\nCtx: ${JSON.stringify(ctx)}`)

        let user = await this.userService.findOneByTelegramId(ctx.from.id)
        if (!user) {
            user = await this.createUserProfile(ctx)
        }
        if (!user.telegramTopic) {
            user = await this.createUserTopic(user)
        }
        return user
    }

    private async createUserTopic(user: UserProfile.BaseType): Promise<UserProfileDocument> {
        const topicTitle = user.telegramId.toString()
        const topicInfo = await this.bot.telegram.createForumTopic(
            internalConstants.moderationForumId,
            topicTitle
        )
        user.telegramTopic = {
            chatId: internalConstants.moderationForumId,
            messageThreadId: topicInfo.message_thread_id,
        }
        const userUpdated = await this.userService.update(user)
        if (!userUpdated) {
            throw Error('Fail to create topic')
        }
        return userUpdated
    }

    async replyUserMessageInTopic(ctx: Context, user: UserProfile.BaseType) {
        if (!user.telegramTopic) {
            throw Error(`Cannot find telegramTopic info in userProfile ${user.telegramId}`)
        }
        if (!ctx.message) return
        await this.bot.telegram.forwardMessage(
            user.telegramTopic.chatId,
            ctx.message.chat.id,
            ctx.message.message_id,
            { message_thread_id: user.telegramTopic.messageThreadId }
        )
    }

    private async createUserProfile(
        ctx: Context | Context<Update.CallbackQueryUpdate>
    ): Promise<UserProfileDocument> {
        if (!ctx.from) throw Error(`Founded ctx without sender\nCtx: ${JSON.stringify(ctx)}`)

        const message = ctx.message as Message.TextMessage
        const startParam =
            message?.entities?.first?.type === 'bot_command' ? message.text.split(' ')[1] : null
        return await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: {
                startParam: startParam,
                registrationDate: new Date(),
                permissions: [],
                notificationsSchedule: {},
                publications: [],
                adminsOnly: {},
            },
            sceneData: {
                sceneName: undefined,
                data: undefined,
            },
        })
    }
}

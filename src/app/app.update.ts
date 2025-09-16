import { On, Start, Update as UpdateNest } from 'nestjs-telegraf'
import { Update } from 'node_modules/telegraf/typings/core/types/typegram'
import { logger } from 'src/app/app.logger'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { UserService } from 'src/business-logic/user/user.service'
import { UserProfile } from 'src/entities/user-profile'
import { ModerationForumDispatcherService } from 'src/presentation/dispatchers/services/moderation-forum-dispatcher.service'
import { StorageChatDispatcherService } from 'src/presentation/dispatchers/services/storage-chat-dispatcher.service'
import { StartCommandHandlerService } from 'src/presentation/user-adapter/start-command-handler/start-command-handler.service'
import { UserBuilderService } from 'src/presentation/user-adapter/user-builder/user-builder.service'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { ContextWithInstanceMetadata } from 'src/utils/telegraf-middlewares/inject-context-instance-metadata'
import { Context } from 'telegraf'
import { ExceptionGuard } from '../exceptions-and-logging/exception-guard.decorator'
import { PrivateDialogDispatcherService } from '../presentation/dispatchers/services/private-dialog-dispatcher.service'
import { internalConstants } from './app.internal-constants'

@UpdateNest()
export class AppUpdate {
    // =====================
    // Properties
    // =====================

    private readonly managerForumIds: number[]
    constructor(
        private readonly privateDialogDispatcher: PrivateDialogDispatcherService,
        private readonly moderationForumDispatcher: ModerationForumDispatcherService,
        private readonly storageChatDispatcher: StorageChatDispatcherService,
        private readonly userBuilder: UserBuilderService,
        private readonly userService: UserService,
        private readonly startCommandHandler: StartCommandHandlerService,
        private readonly chainTasksService: ChainTasksService
    ) {
        this.managerForumIds = [
            internalConstants.chatIds.moderationForums.default,
            internalConstants.chatIds.moderationForums.default,
            ...internalConstants.chatIds.moderationForums.legacyIds,
        ]
    }

    // =====================
    // Methods
    // =====================

    @Start()
    @ExceptionGuard({
        generateArgsLogMetadata: (ctx) => `Update: ${JSON.stringify(ctx.update)}`,
    })
    async startCommand(ctx: ExtendedMessageContext & ContextWithInstanceMetadata) {
        if (ctx.chat.type !== 'private') return
        logger.log(`User ${ctx.from?.id} ${ctx.from?.first_name} has started the bot`)
        const userGetResult = await this.userBuilder.getUserProfile(ctx)

        // Message from private chat with user
        this.replyUserMessageToTopic(ctx, userGetResult.user)

        const result = await this.startCommandHandler.handleStart(ctx, userGetResult.user)
        if (result.abortNextHandling === false) {
            await this.privateDialogDispatcher.handleUserMessage({
                userTelegramId: userGetResult.user.telegramId,
                ctx,
            })
        }
    }

    @On(['message'])
    @ExceptionGuard({
        generateArgsLogMetadata: (ctx) => `Update: ${JSON.stringify(ctx.update)}`,
    })
    async onMessage(ctx: ExtendedMessageContext & ContextWithInstanceMetadata) {
        const message = ctx.message
        if (message.type === 'text') {
            logger.log(
                `[Chat:${ctx.chat.id}] User ${ctx.from.id} ${ctx.from.first_name} has sent a message: "${message.text}"`
            )
        } else {
            const messageJsonString = JSON.stringify(ctx.message)
            logger.log(
                `[Chat:${ctx.chat.id}] From ${ctx.from?.id} ${ctx.from?.first_name} receive ${messageJsonString}`
            )
        }

        if (ctx.chat.type === 'private') {
            // Message from private chat with user
            const userProfileResult = await this.userBuilder.getUserProfile(ctx)
            const userProfile = userProfileResult.user
            this.replyUserMessageToTopic(ctx, userProfile)

            await this.privateDialogDispatcher.handleUserMessage({
                userTelegramId: userProfile.telegramId,
                ctx,
            })
        } else if (this.managerForumIds.includes(ctx.chat.id)) {
            // Message in moderation forum
            if (!ctx.message.message_thread_id) return
            if (ctx.from.is_bot === true) return

            const [userProfileByTopic, adminProfileResult] = await Promise.all([
                this.userService.findOneByForumTopic(ctx.chat.id, ctx.message.message_thread_id),
                this.userBuilder.getUserProfile(ctx),
            ])

            if (!userProfileByTopic) {
                logger.error(`Can not find user profile by topic\n${JSON.stringify(ctx.message)}`)
                const userProfile = await this.userService.findOneByAnyTopic(
                    ctx.chat.id,
                    ctx.message.message_thread_id
                )
                if (userProfile) {
                    await ctx.replyWithHTML(
                        `Эта тема больше не актуальна!\n\n${UserProfile.Formatter.createTopicsInfoString(userProfile)}`
                    )
                } else {
                    await ctx.replyWithHTML(
                        'Не удалось определить пользователя по топику, уточните информацию у разработчиков'
                    )
                }
                return
            }
            if (userProfileByTopic) {
                await this.moderationForumDispatcher.handleAdminMessageInTopic({
                    ctx: ctx,
                    adminProfile: adminProfileResult.user,
                    userProfile: userProfileByTopic,
                })
                return
            }
        } else if (ctx.chat.id === internalConstants.chatIds.fileStorageChatId) {
            await this.storageChatDispatcher.handleUserMessage(ctx)
        }
    }

    @On(['callback_query'])
    @ExceptionGuard({
        generateArgsLogMetadata: (ctx) => `Update: ${JSON.stringify(ctx.update)}`,
    })
    async onInlineButton(ctx: Context<Update.CallbackQueryUpdate> & ContextWithInstanceMetadata) {
        const callbackQueryString = JSON.stringify(ctx.callbackQuery, null, 2)
        logger.log(
            `User ${ctx.from?.id} ${ctx.from?.first_name} pressed the inline button ${callbackQueryString}"`
        )

        if (ctx.chat?.id === internalConstants.chatIds.fileStorageChatId) {
            await this.storageChatDispatcher.handleUserCallback(ctx)
            return
        }

        if (ctx.chat?.type !== 'private') return

        // Message from private chat with user
        const userProfileResult = await this.userBuilder.getUserProfile(ctx)
        if (!userProfileResult) {
            const tgUserInfo = JSON.stringify(ctx.from, null, 2)
            throw Error(`Cannot create user profile with id ${tgUserInfo}`)
        }
        await this.moderationForumDispatcher.sendCallbackDataToForum(
            userProfileResult.user,
            ctx.callbackQuery
        )

        await this.privateDialogDispatcher.handleUserCallback({
            userTelegramId: userProfileResult.user.telegramId,
            user: userProfileResult.user,
            ctx,
        })
    }

    @On(['my_chat_member'])
    @ExceptionGuard({
        generateArgsLogMetadata: (ctx) => `Update: ${JSON.stringify(ctx.update)}`,
    })
    async onMyChatMemberUpdate(ctx: Context<Update.MyChatMemberUpdate>) {
        const updateJsonString = JSON.stringify(ctx.myChatMember)
        logger.log(`Receive update 'my_chat_member' ${updateJsonString}`)
        if (ctx.chat.type !== 'private') return
        if (
            ctx.myChatMember.new_chat_member.status !== 'kicked' &&
            ctx.myChatMember.new_chat_member.status !== 'member'
        ) {
            return
        }

        const { user } = await this.userBuilder.getUserProfile(ctx)

        switch (ctx.myChatMember.new_chat_member.status) {
            case 'kicked':
                logger.log(`User block bot: ${user.telegramId}`)
                await this.userService.update({
                    telegramId: user.telegramId,
                    isBotBlocked: true,
                })
                await this.userService.logToUserHistory(
                    { telegramId: user.telegramId },
                    {
                        type: 'botBlocked',
                    }
                )
                await this.chainTasksService.addTasks({
                    onlyIfSameDoesNotExists: false,
                    tasks: [
                        {
                            userTelegramId: user.telegramId,
                            action: {
                                resourceType: 'telegram',
                                actionType: 'sendMessage',
                                dialogType: 'topicDefault',
                                data: {
                                    type: 'text',
                                    text: 'Заблокировал бота',
                                },
                            },
                        },
                    ],
                })
                break

            case 'member':
                if (user.isBotBlocked === false) break
                logger.log(`User unblock bot: ${user.telegramId}`)

                await this.userService.update({
                    telegramId: user.telegramId,
                    isBotBlocked: false,
                    telegramUserIsDeactivated: false,
                })
                await this.userService.logToUserHistory(
                    { telegramId: user.telegramId },
                    {
                        type: 'botUnblocked',
                    }
                )

                await this.chainTasksService.addTasks({
                    onlyIfSameDoesNotExists: false,
                    tasks: [
                        {
                            userTelegramId: user.telegramId,
                            action: {
                                resourceType: 'telegram',
                                actionType: 'sendMessage',
                                dialogType: 'topicDefault',
                                data: {
                                    type: 'text',
                                    text: 'Разблокировал бота',
                                },
                            },
                        },
                    ],
                })
                break
        }
    }

    async replyUserMessageToTopic(ctx: ExtendedMessageContext, user: UserProfile.BaseType) {
        if (!ctx.message) return

        const messagesArray = ctx.mediaGroup ? ctx.mediaGroup.messages : [ctx.message]
        if (messagesArray.length === 0) return

        await this.chainTasksService.addTask({
            userTelegramId: user.telegramId,
            action: {
                resourceType: 'telegram',
                actionType: 'forwardPrivateMessagesToTopic',
                dialogType: 'topicDefault',
                forwardFromChatId: messagesArray[0].chat.id,
                forwardMessageIds: messagesArray.map((message) => message.message_id),
            },
        })
    }
}

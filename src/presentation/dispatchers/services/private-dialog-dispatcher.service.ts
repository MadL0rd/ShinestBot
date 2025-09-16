import { Injectable } from '@nestjs/common'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { TelegramBridgeFactoryService } from 'src/business-logic/telegram-bridge/telegram-bridge-factory/telegram-bridge-factory.service'
import { TelegramDirectDialogInteractor } from 'src/business-logic/telegram-bridge/telegram-ddi/telegram-ddi'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { UserProfile } from 'src/entities/user-profile'
import { sceneCallbackDataCompressedSchema } from 'src/presentation/scenes/models/scene-callback'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { SceneName } from 'src/presentation/scenes/models/scene-name.enum'
import {
    IScene,
    SceneHandlerCompletion,
    SceneHandlerCompletionDoNothing,
    SceneUserContext,
} from 'src/presentation/scenes/models/scene.interface'
import { SceneFactoryService } from 'src/presentation/scenes/scene-factory/scene-factory.service'
import { UserSupportService } from 'src/presentation/user-adapter/user-support/user-support.service'
import { LockAsyncWithSharedMutex } from 'src/utils/decorators/lock-async'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { MessageContextTyped } from 'src/utils/telegraf-middlewares/inject-message-types'
import { Context } from 'telegraf'
import { Update } from 'telegraf/types'

@Injectable()
export class PrivateDialogDispatcherService {
    // =====================
    // Properties
    // =====================

    private readonly defaultScene: SceneEntrance.SomeSceneDto = { sceneName: 'mainMenu' }

    constructor(
        private readonly botContentService: BotContentService,
        private readonly userService: UserService,
        private readonly sceneFactory: SceneFactoryService,
        private readonly userSupport: UserSupportService,
        private readonly telegramBridgeFactory: TelegramBridgeFactoryService
    ) {}

    // =====================
    // Public methods
    // =====================
    @LockAsyncWithSharedMutex({
        generateMutexId: (args) => `${args.userTelegramId}-scene-update`,
    })
    async handleUserMessage(args: {
        userTelegramId: number
        ctx: ExtendedMessageContext
    }): Promise<void> {
        const { userTelegramId, ctx } = args

        const userContext = await this.generateSceneUserContext({ userTelegramId })
        const user = userContext.user

        await this.handleReceiveUpdateFromUser({ ctx, user })

        const textMessage = ctx.message.type === 'text' ? ctx.message : undefined
        this.userService.logToUserHistory(user, {
            type: 'sendMessage',
            text: textMessage?.text,
            message: ctx.message,
        })

        // Check message text is segue command like /back_to_menu
        const sceneCommandSegue = this.getSceneNameFromTextCommandSegue(textMessage?.text)
        if (sceneCommandSegue) {
            await this.enterScene({
                userTelegramId: userTelegramId,
                userContext,
                sceneEntranceDto: sceneCommandSegue,
            })
            return
        }

        const sceneNamePreviouslyUsed = SceneName.castToInstance(user.sceneData?.sceneName)
        const currentScene = this.createSceneWith(sceneNamePreviouslyUsed, userContext)
        if (!currentScene) {
            await this.enterScene({
                userTelegramId: userTelegramId,
                userContext,
                sceneEntranceDto: this.defaultScene,
            })
            return
        }

        const userCanUseStoredScene = await this.validateUserCanUseScene({
            ddi: userContext.ddi,
            botContent: userContext.botContent,
            scene: currentScene,
            sendMessageIfAccessDenied: false,
        })
        if (!userCanUseStoredScene) {
            await this.enterScene({
                userTelegramId: userTelegramId,
                userContext,
                sceneEntranceDto: this.defaultScene,
            })
            return
        }

        const sceneCompletion = await currentScene.handleMessage(
            ctx,
            userContext.user.sceneData?.data ?? {}
        )

        await this.applySceneUpdateHandlerCompletion({
            ctx,
            userContext,
            scene: currentScene,
            completion: sceneCompletion,
        })
    }

    @LockAsyncWithSharedMutex({
        generateMutexId: (args) => `${args.userTelegramId}-scene-update`,
    })
    async handleUserCallback(args: {
        userTelegramId: number
        user: UserProfileDocument
        ctx: Context<Update.CallbackQueryUpdate>
    }): Promise<void> {
        const { userTelegramId, ctx } = args

        // Extract and validate callback data
        const dataQuery = 'data' in ctx.callbackQuery ? ctx.callbackQuery : null
        const callbackDataParseResult = sceneCallbackDataCompressedSchema.safeParse(dataQuery?.data)
        const callbackData = callbackDataParseResult.data

        const userContext = await this.generateSceneUserContext({ userTelegramId })
        this.userService.logToUserHistory(userContext.user, {
            type: 'callbackButtonDidTapped',
            data: dataQuery?.data,
            dataParsed: callbackData,
        })

        await this.handleReceiveUpdateFromUser({ ctx, user: userContext.user })

        if (!callbackData) {
            logger.error(
                `Can not parse callback data from ${JSON.stringify(ctx.callbackQuery)}`,
                callbackDataParseResult.error
            )
            return
        }

        // Create scene and handle callback
        const callbackOwnerScene = this.createSceneWith(callbackData.sceneName, userContext)
        if (!callbackOwnerScene) {
            logger.error(
                `Scene creation fails user: ${userTelegramId}, callbackData: ${JSON.stringify(callbackData)}`
            )
            return
        }

        const userCanUseCallbackOwnerScene = await this.validateUserCanUseScene({
            ddi: userContext.ddi,
            botContent: userContext.botContent,
            scene: callbackOwnerScene,
            sendMessageIfAccessDenied: false,
        })
        if (!userCanUseCallbackOwnerScene) {
            await this.enterScene({
                userTelegramId: userTelegramId,
                userContext,
                sceneEntranceDto: this.defaultScene,
            })
            return
        }
        const sceneCompletion = await callbackOwnerScene.handleCallback(ctx, callbackData.action)

        await this.applySceneUpdateHandlerCompletion({
            ctx,
            userContext,
            scene: callbackOwnerScene,
            completion: sceneCompletion,
        })
    }

    /**
     * Use this method to start scene for user
     * from whatever you want but not this class itself
     *
     * WARNING: Do not call this method from
     * methods with same mutexId in case of deadlock
     */
    @LockAsyncWithSharedMutex({
        generateMutexId: (args) => `${args.userTelegramId}-scene-update`,
    })
    async enterNewScene(args: {
        userTelegramId: number
        sceneEntranceDto: SceneEntrance.SomeSceneDto
    }) {
        const { userTelegramId, sceneEntranceDto } = args
        const userContext = await this.generateSceneUserContext({ userTelegramId })
        await this.enterScene({
            userTelegramId,
            userContext,
            sceneEntranceDto,
        })
    }

    // =====================
    // Private methods
    // =====================

    private async handleReceiveUpdateFromUser(args: {
        ctx: Context<Update.CallbackQueryUpdate> | ExtendedMessageContext
        user: UserProfileDocument
    }) {
        const { user, ctx } = args

        this.userService.update({
            telegramId: user.telegramId,
            telegramInfo: ctx?.from ?? user.telegramInfo,
            unsuccessfulManagerNotificationsCount: 0,
        })
    }

    private getSceneNameFromTextCommandSegue(command?: string): SceneEntrance.SomeSceneDto | null {
        command = command?.split(' ').shift()
        switch (command) {
            case '/back_to_menu':
                return { sceneName: 'mainMenu', forceSendMenuMessageOnEnter: true }
            case '/start':
                return { sceneName: 'onboarding', type: 'onStart' }
            case '/am':
                return { sceneName: 'adminMenu' }
            default:
                return null
        }
    }

    private async generateSceneUserContext(args: {
        userTelegramId: number
    }): Promise<SceneUserContext> {
        const { userTelegramId } = args

        const user = await this.userService.findOneByTelegramId(userTelegramId)
        if (!user) throw Error(`User ${userTelegramId} profile is not created!`)
        if (user.isBotBlocked || user.telegramUserIsDeactivated) {
            user.isBotBlocked = false
            user.telegramUserIsDeactivated = false
            this.userService.update(user, ['isBotBlocked', 'telegramUserIsDeactivated'])
        }
        const userAccessRules = UserProfile.Helper.getUserAccessRules(user.permissions)
        const botContent = await this.botContentService.getContentForUser(user)

        return {
            user: user,
            userAccessRules: userAccessRules,
            botContent: botContent,
            ddi: this.telegramBridgeFactory.generateDdi({ userTelegramId: userTelegramId }),
        }
    }

    private async validateUserCanUseScene(args: {
        ddi: TelegramDirectDialogInteractor
        botContent: BotContent.BaseType
        scene?: IScene
        sendMessageIfAccessDenied?: boolean
    }): Promise<boolean> {
        const { ddi, botContent, scene, sendMessageIfAccessDenied } = {
            sendMessageIfAccessDenied: true,
            ...args,
        }
        if (!scene) return false

        const validationResult = scene.validateUseScenePermissions()
        if (validationResult.canUseScene) return true

        logger.log(`${scene?.name.toUpperCase()} access denied for user ${ddi.userTelegramId}`)
        if (sendMessageIfAccessDenied) {
            await ddi.sendHtml(
                validationResult.validationErrorMessage ??
                    botContent.uniqueMessage.common.permissionDenied
            )
        }
        return false
    }

    private createSceneWith(
        name: SceneName.Union | null,
        userContext: SceneUserContext
    ): IScene | null {
        if (!name) return null
        return this.sceneFactory.createSceneByName(name)?.injectUserContext(userContext) ?? null
    }

    private async applySceneUpdateHandlerCompletion(args: {
        ctx: MessageContextTyped | Context<Update.CallbackQueryUpdate>
        userContext: SceneUserContext
        scene: IScene
        completion: SceneHandlerCompletion
    }) {
        const { ctx, userContext, scene, completion } = args

        switch (completion.type) {
            case 'doNothing':
                if (completion.didHandledUserInteraction === false) {
                    this.sceneCanNotHandleUserUpdate({
                        ctx,
                        user: userContext.user,
                        ddi: userContext.ddi,
                        botContent: userContext.botContent,
                        scene,
                        completion,
                    })
                }
                return

            case 'inProgress':
                await this.userService.update({
                    telegramId: userContext.user.telegramId,
                    sceneData: {
                        sceneName: scene.name,
                        data: completion.sceneData,
                    },
                })
                return

            case 'transition':
                await this.enterScene({
                    userTelegramId: userContext.user.telegramId,
                    userContext,
                    sceneEntranceDto: completion.nextScene ?? this.defaultScene,
                })
                return
        }
    }

    private async enterScene(args: {
        userTelegramId: number
        userContext: SceneUserContext
        sceneEntranceDto: SceneEntrance.SomeSceneDto
    }) {
        const { userTelegramId } = args
        let { sceneEntranceDto, userContext } = args

        let nextSceneName: SceneName.Union | null = SceneName.castToInstance(
            sceneEntranceDto.sceneName
        )
        let nextScene: IScene | null = null
        let sceneCompletion: SceneHandlerCompletion | null = null
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, userContext)
            if (!nextScene) break

            const userCanUseScene = await this.validateUserCanUseScene({
                ddi: userContext.ddi,
                botContent: userContext.botContent,
                scene: nextScene,
                sendMessageIfAccessDenied: false,
            })
            if (userCanUseScene === false) return

            sceneCompletion = await nextScene.handleEnterScene(sceneEntranceDto)
            userContext = await this.generateSceneUserContext({ userTelegramId })

            switch (sceneCompletion.type) {
                case 'doNothing':
                    if (sceneCompletion.didHandledUserInteraction) {
                        this.sceneCanNotHandleUserUpdate({
                            ctx: null,
                            user: userContext.user,
                            ddi: userContext.ddi,
                            botContent: userContext.botContent,
                            scene: nextScene,
                            completion: sceneCompletion,
                        })
                    }
                    return

                case 'transition':
                    sceneEntranceDto = sceneCompletion.nextScene ?? this.defaultScene
                    nextSceneName = sceneEntranceDto.sceneName
                    break

                case 'inProgress':
                    await this.userService.update({
                        telegramId: userTelegramId,
                        sceneData: {
                            sceneName: nextSceneName,
                            data: sceneCompletion.sceneData,
                        },
                    })
                    return
            }
        }
    }

    private async sceneCanNotHandleUserUpdate(args: {
        ctx: ExtendedMessageContext | Context<Update.CallbackQueryUpdate> | null
        user: UserProfileDocument
        ddi: TelegramDirectDialogInteractor
        botContent: BotContent.BaseType
        scene: IScene
        completion: SceneHandlerCompletionDoNothing
    }) {
        const { user, ddi, botContent, ctx, scene, completion } = args

        this.userService.logToUserHistory(user, {
            type: 'sceneCanNotHandleUserUpdate',
            sceneName: scene.name,
            telegramUpdate: (ctx?.update as unknown as Record<string, unknown>) ?? {},
        })

        await this.userSupport.handleSupportRequest({
            user: user,
            ctx: ctx,
            sourceType: `privateDialogCanNotHandle Scene: ${scene.name}`,
        })

        // TODO: refactor wits logic later
        let timeoutMinutesMessageFromAdmin = Number(
            botContent.uniqueMessage.adminForum.messageFromAdminTimeout
        )
        if (Number.isNaN(timeoutMinutesMessageFromAdmin)) {
            timeoutMinutesMessageFromAdmin = 15
            logger.error(
                `timeoutMessageFromAdminTimeout is not a number.\nUsed ${timeoutMinutesMessageFromAdmin}`
            )
        }
        const isMessageFromAdminTimeoutReached =
            user.lastContactWithModerator?.datetime?.isTimeoutReached(
                timeoutMinutesMessageFromAdmin,
                'minutes'
            ) ?? true

        if (!isMessageFromAdminTimeoutReached) return

        if (completion.didAlreadySendErrorMessage) return

        await ddi.sendHtml(botContent.uniqueMessage.common.errorMessage)
    }
}

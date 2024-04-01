import { Injectable } from '@nestjs/common'
import { Context, Telegraf } from 'telegraf'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { UserService } from 'src/business-logic/user/user.service'
import { SceneName } from 'src/presentation/scenes/models/scene-name.enum'
import { logger } from 'src/app/app.logger'
import { UserHistoryEvent } from 'src/business-logic/user/enums/user-history-event.enum'
import { getActiveUserPermissionNames } from 'src/utils/getActiveUserPermissions'
import { getLanguageFor } from 'src/utils/getLanguageForUser'
import { plainToClass } from 'class-transformer'
import {
    Update,
    Message,
    CallbackQuery,
    User as UserTelegram,
} from 'node_modules/telegraf/typings/core/types/typegram'
import { InjectBot } from 'nestjs-telegraf'
import { SceneCallbackData } from 'src/presentation/scenes/models/scene-callback'
import {
    SceneHandlerCompletion,
    IScene,
    SceneUserContext,
} from 'src/presentation/scenes/models/scene.interface'
import { SceneFactoryService } from 'src/presentation/scenes/scene-factory/scene-factory.service'
import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'

@Injectable()
export class PrivateDialogDispatcherService {
    // =====================
    // Properties
    // =====================

    private readonly startScene: SceneEntrance.SomeSceneDto = {
        sceneName: 'languageSettings',
        nextScene: { sceneName: 'onboarding' },
    }
    private readonly defaultSceneName: SceneName.Union = 'mainMenu'

    constructor(
        private readonly botContentService: BotContentService,
        private readonly userService: UserService,
        private readonly sceneFactory: SceneFactoryService,
        @InjectBot() private readonly bot: Telegraf<Context>
    ) {}

    // =====================
    // Public methods
    // =====================
    async handleUserStart(ctx: Context<Update>): Promise<void> {
        if (!ctx.from) {
            logger.error(`Founded ctx without sender (prop ctx.from)\nCtx: ${JSON.stringify(ctx)}`)
            return
        }

        const message = ctx.message as Message.TextMessage
        const startParam =
            message?.entities?.first?.type === 'bot_command' ? message.text.split(' ')[1] : null
        const user = await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: {
                startParam: startParam,
                registrationDate: new Date(),
                permissions: [],
                notificationsSchedule: {},
                publications: [],
            },
        })

        await this.userService.logToUserHistory(user, UserHistoryEvent.start, `${startParam}`)

        const userContext = await this.generateSceneUserContext(ctx.from)

        const startScene = this.createSceneWith(this.startScene.sceneName, userContext)
        if (!startScene) {
            logger.error(`Start scene creation failed!\nUser: ${JSON.stringify(ctx.from)}`)
            return
        }
        const sceneCompletion = await startScene.handleEnterScene(ctx, this.startScene)

        // Save scene state
        await this.userService.update({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: user.internalInfo,
            sceneData: {
                sceneName: startScene.name,
                data: sceneCompletion.sceneData,
            },
        })
    }

    async handleUserMessage(ctx: Context<Update>): Promise<void> {
        if (!ctx.from) {
            logger.error(`Founded ctx without sender (prop ctx.from)\nCtx: ${JSON.stringify(ctx)}`)
            return
        }

        // =====================
        // Prepare user context
        // Localized bot content, permissions etc.
        // =====================

        let userContext = await this.generateSceneUserContext(ctx.from)
        const message = ctx.message as Message.TextMessage

        await this.userService.logToUserHistory(
            userContext.user,
            UserHistoryEvent.sendMessage,
            message?.text
        )

        // Check message text is segue command like /back_to_menu
        const sceneNameFromCommandSegue = this.getSceneNameFromTextCommandSegue(message?.text)

        // =====================
        // Try to find previous storred user scene
        // and continue
        // if there is no segue from command
        // =====================
        const sceneNamePreviouslyUsed = SceneName.castToInstance(
            userContext.user.sceneData?.sceneName
        )
        const currentScene = this.createSceneWith(sceneNamePreviouslyUsed, userContext)
        let sceneCompletion: SceneHandlerCompletion | null = null

        if (currentScene) {
            const userCanUseStoredScene = await this.validateUserCanUseScene(
                ctx,
                userContext.botContent,
                currentScene
            )
            if (!sceneNameFromCommandSegue && userCanUseStoredScene === true) {
                logger.log(
                    `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
                )
                sceneCompletion = await currentScene.handleMessage(
                    ctx,
                    userContext.user.sceneData.data ?? {}
                )
                userContext = await this.generateSceneUserContext(ctx.from)
            }
        }

        // =====================
        // Start next scene if needed
        // =====================
        let nextSceneName: SceneName.Union | null =
            sceneNameFromCommandSegue ?? this.getNextSceneNameFromCompletion(sceneCompletion)
        let sceneEnterData = sceneNameFromCommandSegue
            ? undefined
            : sceneCompletion?.nextSceneIfCompleted
        let nextScene: IScene | null = null
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, userContext)
            if (!nextScene) break

            const userCanUseScene = await this.validateUserCanUseScene(
                ctx,
                userContext.botContent,
                nextScene
            )
            if (userCanUseScene) {
                sceneCompletion = await nextScene.handleEnterScene(ctx, sceneEnterData)
                userContext = await this.generateSceneUserContext(ctx.from)
            } else {
                nextScene = null
                sceneCompletion = null
            }

            // Return for bunned users
            if (sceneCompletion == null) {
                return
            }

            nextSceneName = this.getNextSceneNameFromCompletion(sceneCompletion)
            sceneEnterData = sceneCompletion.nextSceneIfCompleted
        }

        // Send canNonHandle message
        if (sceneCompletion && sceneCompletion.didHandledUserInteraction === false) {
            ctx.replyWithHTML(userContext.botContent.uniqueMessage.common.unknownState)
        }

        // =====================
        // Save scene state
        // =====================
        await this.userService.update({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: userContext.user.internalInfo,
            sceneData: {
                sceneName: nextScene?.name ?? currentScene?.name ?? this.defaultSceneName,
                data: sceneCompletion?.sceneData ?? {},
            },
        })
    }

    async handleUserCallback(ctx: Context<Update.CallbackQueryUpdate>): Promise<void> {
        if (!ctx.from) {
            logger.error(`Founded ctx without sender (prop ctx.from)\nCtx: ${JSON.stringify(ctx)}`)
            return
        }
        const dataQuery = ctx.callbackQuery as CallbackQuery.DataQuery | undefined

        let userContext = await this.generateSceneUserContext(ctx.from)
        await this.userService.logToUserHistory(
            userContext.user,
            UserHistoryEvent.callbackButtonDidTapped,
            dataQuery?.data ?? '*empty*'
        )

        let callbackData: SceneCallbackData | null = null

        try {
            callbackData = plainToClass(SceneCallbackData, JSON.parse(dataQuery?.data ?? '{}'))
        } catch {}

        if (!callbackData) {
            logger.error('Can not parse callback data from', ctx.callbackQuery)
            return
        }
        logger.log(`Received callback data: ${callbackData.toPrettyString()}`)

        const sceneName = SceneName.castToInstance(callbackData.sceneName)
        const currentScene = this.createSceneWith(sceneName, userContext)

        if (!currentScene) {
            logger.error(`Scene calback creation failed!\nUser: ${JSON.stringify(ctx.from)}`)
            return
        }

        let sceneCompletion: SceneHandlerCompletion | null = null
        if (await this.validateUserCanUseScene(ctx, userContext.botContent, currentScene)) {
            logger.log(
                `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
            )
            sceneCompletion = await currentScene.handleCallback(ctx, callbackData)
            userContext = await this.generateSceneUserContext(ctx.from)

            if (sceneCompletion.inProgress == true) {
                await this.userService.update({
                    telegramId: ctx.from.id,
                    telegramInfo: ctx.from,
                    internalInfo: userContext.user.internalInfo,
                    sceneData: {
                        sceneName: currentScene?.name ?? this.defaultSceneName,
                        data: sceneCompletion.sceneData,
                    },
                })
                return
            }
        }

        let nextSceneName: SceneName.Union | null = SceneName.castToInstance(
            sceneCompletion?.nextSceneIfCompleted?.sceneName
        )
        let nextScene: IScene | null = null
        let sceneEnterData = sceneCompletion?.nextSceneIfCompleted
        let didStartedAnyScene = false
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, userContext)
            if (!nextScene) break

            if (await this.validateUserCanUseScene(ctx, userContext.botContent, nextScene, false)) {
                sceneCompletion = await nextScene.handleEnterScene(ctx as any, sceneEnterData)
                userContext = await this.generateSceneUserContext(ctx.from)
                didStartedAnyScene = true
            } else {
                nextScene = null
            }

            // Return for bunned users
            if (sceneCompletion == null) {
                return
            }

            sceneEnterData = sceneCompletion.nextSceneIfCompleted
            nextSceneName = this.getNextSceneNameFromCompletion(sceneCompletion)
        }

        // Send canNonHandle message
        if (!sceneCompletion || sceneCompletion.didHandledUserInteraction !== true) {
            ctx.replyWithHTML(userContext.botContent.uniqueMessage.common.callbackActionFaild)
        }

        if (didStartedAnyScene) {
            await this.userService.update({
                telegramId: ctx.from.id,
                telegramInfo: ctx.from,
                internalInfo: userContext.user.internalInfo,
                sceneData: {
                    sceneName: nextScene?.name ?? this.defaultSceneName,
                    data: sceneCompletion?.sceneData ?? {},
                },
            })
        }
    }

    // =====================
    // Private methods
    // =====================

    private getSceneNameFromTextCommandSegue(command?: string): SceneName.Union | null {
        switch (command) {
            case '/back_to_menu':
                return this.defaultSceneName
            default:
                return null
        }
    }

    private getNextSceneNameFromCompletion(
        sceneCompletion: SceneHandlerCompletion | null
    ): SceneName.Union | null {
        if (sceneCompletion) {
            if (sceneCompletion.inProgress === false) {
                // Exit from current scene
                const nextSceneName = sceneCompletion?.nextSceneIfCompleted?.sceneName
                if (nextSceneName) {
                    // Next scene is specified
                    return nextSceneName
                } else {
                    // Next scene is not specified
                    return this.defaultSceneName
                }
            } else {
                // Current scene in progress
                return null
            }
        } else {
            // There is no completion from passed scenee so need to start default scene
            return this.defaultSceneName
        }
    }

    private createSceneWith(
        name: SceneName.Union | null,
        userContext: SceneUserContext
    ): IScene | null {
        if (!name) return null

        return this.sceneFactory.createSceneWith(name)?.injectUserContext(userContext) ?? null
    }

    private async validateUserCanUseScene(
        ctx: Context<Update> | Context<Update.CallbackQueryUpdate>,
        botContent: BotContent,
        scene?: IScene,
        needToSendMessage: boolean = true
    ): Promise<boolean> {
        if (!scene) {
            return false
        }
        const validationResult = scene.validateUseScenePermissions()

        if (validationResult.canUseScene) {
            return true
        } else {
            logger.log(`${scene?.name.toUpperCase()} validation failed`)
            if (needToSendMessage) {
                await ctx.replyWithHTML(
                    validationResult.validationErrorMessage ??
                        botContent.uniqueMessage.common.permissionDenied
                )
            }
            return false
        }
    }

    private async generateSceneUserContext(telegramUser: UserTelegram): Promise<SceneUserContext> {
        const user = await this.userService.createIfNeededAndGet({
            telegramId: telegramUser.id,
            telegramInfo: telegramUser,
            internalInfo: {
                startParam: null,
                registrationDate: new Date(),
                permissions: [],
                notificationsSchedule: {},
                publications: [],
            },
        })
        const userActivePermissions = getActiveUserPermissionNames(user)

        const userLanguage = getLanguageFor(user)
        const botContent = await this.botContentService.getContent(userLanguage)

        return {
            user: user,
            userActivePermissions: userActivePermissions,
            botContent: botContent,
        }
    }
}

import { Context, Telegraf } from 'telegraf'
import { CallbackQuery, Update, User } from 'telegraf/typings/core/types/typegram'
import { IDispatcher } from '../dispatcher.interface'
import { BotContentService } from 'src/core/bot-content/bot-content.service'
import { UserService } from 'src/core/user/user.service'
import {
    IScene,
    SceneCallbackData,
    SceneHandlerCompletion,
} from 'src/presentation/scenes/scene.interface'
import { SceneName } from 'src/presentation/scenes/enums/scene-name.enum'
import { logger } from 'src/app.logger'
import { UserPermissionNamesStable } from 'src/core/user/enums/user-permission.enum'
import { BotContentStable } from 'src/core/bot-content/schemas/bot-content.schema'
import { UserDocument } from 'src/core/user/schemas/user.schema'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'
import { Message } from 'telegraf/typings/core/types/typegram'
import { SceneFactory } from 'src/presentation/scenes/scene-factory'
import { getActiveUserPermissionNames } from 'src/utils/getActiveUserPermissions'
import { getLanguageFor } from 'src/utils/getLanguageForUser'
import { plainToClass } from 'class-transformer'
import { LocalizationService } from 'src/core/localization/localization.service'

export class PrivateDialogDispatcher implements IDispatcher {
    // =====================
    // Properties
    // =====================

    private readonly startSceneName: SceneName = SceneName.onboarding
    private readonly defaultSceneName: SceneName = SceneName.mainMenu

    constructor(
        private readonly botContentService: BotContentService,
        private readonly localizationService: LocalizationService,
        private readonly userService: UserService,
        private readonly bot: Telegraf<Context>
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
            },
        })

        await this.userService.logToUserHistory(user, UserHistoryEvent.start, `${startParam}`)

        const data = await this.getHandlingTransactionUserData(ctx.from)

        const startScene = this.createSceneWith(this.startSceneName, data)
        if (!startScene) {
            logger.error(`Start scene creation failed!\nUser: ${JSON.stringify(ctx.from)}`)
            return
        }
        const sceneCompletion = await startScene.handleEnterScene(ctx)

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
        // Prepare data
        // =====================

        let data = await this.getHandlingTransactionUserData(ctx.from)
        const message = ctx.message as Message.TextMessage

        await this.userService.logToUserHistory(
            data.user,
            UserHistoryEvent.sendMessage,
            message?.text
        )

        // Check message text is segue command like /back_to_menu
        const sceneNameFromCommandSegue = this.getSceneNameFromTextCommandSegue(message?.text)

        // =====================
        // Try to find current scene
        // if there is no segue from command
        // =====================
        const sceneName = SceneName.getBySceneName(data.user.sceneData?.sceneName)
        const currentScene = this.createSceneWith(sceneName, data)
        let sceneCompletion: SceneHandlerCompletion | null = null

        if (currentScene) {
            const userCanUseStoredScene = await this.validateUserCanUseScene(
                ctx,
                data,
                currentScene
            )
            if (!sceneNameFromCommandSegue && userCanUseStoredScene === true) {
                logger.log(
                    `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
                )
                sceneCompletion = await currentScene.handleMessage(
                    ctx,
                    data.user.sceneData.data ?? {}
                )
                data = await this.getHandlingTransactionUserData(ctx.from)
            }
        }

        // =====================
        // Start next scene if needed
        // =====================
        let nextSceneName: SceneName | null =
            sceneNameFromCommandSegue ?? this.getSceneNameFromCompletion(sceneCompletion)
        let nextScene: IScene | null = null
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, data)
            if (!nextScene) break

            const userCanUseScene = await this.validateUserCanUseScene(ctx, data, nextScene)
            if (userCanUseScene) {
                sceneCompletion = await nextScene.handleEnterScene(ctx)
                data = await this.getHandlingTransactionUserData(ctx.from)
            } else {
                nextScene = null
                sceneCompletion = null
            }

            // Return for bunned users
            if (sceneCompletion == null) {
                return
            }

            nextSceneName = this.getSceneNameFromCompletion(sceneCompletion)
        }

        // Send canNonHandle message
        if (sceneCompletion && sceneCompletion.didHandledUserInteraction === false) {
            ctx.replyWithHTML(data.botContent.uniqueMessage.common.unknownState)
        }

        // =====================
        // Save scene state
        // =====================
        await this.userService.update({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: data.user.internalInfo,
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

        let data = await this.getHandlingTransactionUserData(ctx.from)
        await this.userService.logToUserHistory(
            data.user,
            UserHistoryEvent.callbackButtonDidTapped,
            dataQuery?.data ?? '*empty*'
        )

        let callbackData: SceneCallbackData | null = null

        try {
            callbackData = plainToClass(
                SceneCallbackData,
                JSON.parse(ctx.callbackQuery['data'] ?? '{}')
            )
        } catch {}

        if (!callbackData) {
            logger.error('Can not parse callback data from', ctx.callbackQuery)
            return
        }
        logger.log(`Received callback data: ${callbackData.toPrettyString()}`)

        const sceneName = SceneName.getBySceneName(callbackData.sceneName)
        const currentScene = this.createSceneWith(sceneName, data)

        if (!currentScene) {
            logger.error(`Scene calback creation failed!\nUser: ${JSON.stringify(ctx.from)}`)
            return
        }

        let sceneCompletion: SceneHandlerCompletion | null = null
        if (await this.validateUserCanUseScene(ctx, data, currentScene)) {
            logger.log(
                `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
            )
            sceneCompletion = await currentScene.handleCallback(ctx, callbackData)
            data = await this.getHandlingTransactionUserData(ctx.from)

            if (sceneCompletion.inProgress == true) {
                await this.userService.update({
                    telegramId: ctx.from.id,
                    telegramInfo: ctx.from,
                    internalInfo: data.user.internalInfo,
                    sceneData: {
                        sceneName: currentScene?.name ?? this.defaultSceneName,
                        data: sceneCompletion.sceneData,
                    },
                })
                return
            }
        }

        let nextSceneName: SceneName | null = sceneCompletion?.nextSceneNameIfCompleted ?? null
        let nextScene: IScene | null = null
        let didStartedAnyScene = false
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, data)
            if (!nextScene) break

            if (await this.validateUserCanUseScene(ctx, data, nextScene, false)) {
                sceneCompletion = await nextScene.handleEnterScene(ctx as Context<Update>)
                data = await this.getHandlingTransactionUserData(ctx.from)
                didStartedAnyScene = true
            } else {
                nextScene = null
            }

            // Return for bunned users
            if (sceneCompletion == null) {
                return
            }

            nextSceneName = this.getSceneNameFromCompletion(sceneCompletion)
        }

        // Send canNonHandle message
        if (!sceneCompletion || sceneCompletion.didHandledUserInteraction !== true) {
            ctx.replyWithHTML(data.botContent.uniqueMessage.common.callbackActionFaild)
        }

        if (didStartedAnyScene) {
            await this.userService.update({
                telegramId: ctx.from.id,
                telegramInfo: ctx.from,
                internalInfo: data.user.internalInfo,
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

    private getSceneNameFromTextCommandSegue(command?: string): SceneName | null {
        switch (command) {
            case '/back_to_menu':
                return this.defaultSceneName
        }
        return null
    }

    private getSceneNameFromCompletion(
        sceneCompletion: SceneHandlerCompletion | null
    ): SceneName | null {
        if (sceneCompletion) {
            if (sceneCompletion.inProgress === false) {
                // Exit from current scene
                if (sceneCompletion?.nextSceneNameIfCompleted) {
                    // Next scene is specified
                    return sceneCompletion.nextSceneNameIfCompleted
                }
                // Next scene is not specified check
                return this.defaultSceneName
            } else {
                // Current scene in progress
                return null
            }
        } else {
            // There is no completion from passed scenee so need to start default scene
            return this.defaultSceneName
        }
    }

    private createSceneWith(name: SceneName | null, data: TransactionUserData): IScene | null {
        if (!name) return null

        return SceneFactory.createSceneWith(name, {
            bot: this.bot,
            user: data.user,
            botContent: data.botContent,
            userService: this.userService,
            botContentService: this.botContentService,
            userActivePermissions: data.userActivePermissions,
            localizationService: this.localizationService,
        })
    }

    private async validateUserCanUseScene(
        ctx: Context<Update> | Context<Update.CallbackQueryUpdate>,
        data: TransactionUserData,
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
                        data.botContent.uniqueMessage.common.permissionDenied
                )
            }
            return false
        }
    }

    private async getHandlingTransactionUserData(telegramUser: User): Promise<TransactionUserData> {
        const user = await this.userService.createIfNeededAndGet({
            telegramId: telegramUser.id,
            telegramInfo: telegramUser,
            internalInfo: {
                startParam: null,
                registrationDate: new Date(),
                permissions: [],
            },
        })
        const userActivePermissions = getActiveUserPermissionNames(user)

        const userLanguage = getLanguageFor(user)
        const botContent = await this.botContentService.getContent(userLanguage)

        return {
            user,
            userActivePermissions,
            userLanguage,
            botContent,
        }
    }
}

interface TransactionUserData {
    user: UserDocument
    userActivePermissions: UserPermissionNamesStable[]
    userLanguage: string
    botContent: BotContentStable
}

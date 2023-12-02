import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
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
import { UserPermissionNames } from 'src/core/user/enums/user-permission-names.enum'
import { BotContentStable } from 'src/core/bot-content/schemas/bot-content.schema'
import { UserDocument } from 'src/core/user/schemas/user.schema'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'
import { Message } from 'telegraf/typings/core/types/typegram'
import { SceneFactory } from 'src/presentation/scenes/scene-factory'
import { getActiveUserPermissions } from 'src/utils/getActiveUserPermissions'
import { getLanguageFor } from 'src/utils/getLanguageForUser'
import { plainToClass } from 'class-transformer'
import { LocalizationService } from 'src/core/localization/localization.service'

export class PrivateDialogDispatcher implements IDispatcher {
    // =====================
    // Properties
    // =====================

    private readonly startSceneName: SceneName = SceneName.languageSettings
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
        const message = ctx.message as Message.TextMessage
        const startParam =
            message?.entities[0].type === 'bot_command' ? message.text.split(' ')[1] : null
        const user = await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: {
                startParam: startParam,
                permissions: [],
            },
        })

        await this.userService.logToUserHistory(user, UserHistoryEvent.start, startParam)

        const data = await this.getHandlingTransactionUserData(ctx)

        const startScene = this.createSceneWith(this.startSceneName, data)
        const sceneCompletion = await startScene.handleEnterScene(ctx)

        // Save scene state
        this.userService.update({
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
        // =====================
        // Prepare data
        // =====================

        let data = await this.getHandlingTransactionUserData(ctx)
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
        const sceneName = SceneName[data.user.sceneData?.sceneName]
        const currentScene = this.createSceneWith(sceneName, data)
        let sceneCompletion: SceneHandlerCompletion = null
        const userCanUseStoredScene = await this.validateUserCanUseScene(ctx, data, currentScene)
        if (!sceneNameFromCommandSegue && userCanUseStoredScene === true) {
            logger.log(
                `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
            )
            sceneCompletion = await currentScene.handleMessage(ctx, data.user.sceneData.data)
            data = await this.getHandlingTransactionUserData(ctx)
        }

        // =====================
        // Start next scene if needed
        // =====================
        let nextSceneName: SceneName =
            sceneNameFromCommandSegue ?? this.getSceneNameFromCompletion(sceneCompletion)
        let nextScene: IScene = null
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, data)

            if (await this.validateUserCanUseScene(ctx, data, nextScene, false)) {
                sceneCompletion = await nextScene.handleEnterScene(ctx)
                data = await this.getHandlingTransactionUserData(ctx)
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
        if (sceneCompletion.didHandledUserInteraction !== true) {
            ctx.replyWithHTML(data.botContent.uniqueMessage.common.unknownState)
        }

        // =====================
        // Save scene state
        // =====================
        this.userService.update({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
            internalInfo: data.user.internalInfo,
            sceneData: {
                sceneName: nextScene?.name ?? currentScene?.name ?? this.defaultSceneName,
                data: sceneCompletion.sceneData,
            },
        })
    }

    async handleUserCallback(ctx: Context<Update>): Promise<void> {
        let data = await this.getHandlingTransactionUserData(ctx)
        await this.userService.logToUserHistory(
            data.user,
            UserHistoryEvent.callbackButtonDidTapped,
            ctx.callbackQuery['data'] ?? '*empty*'
        )

        let callbackData: SceneCallbackData = null

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

        const sceneName = SceneName[callbackData.sceneName]
        const currentScene = this.createSceneWith(sceneName, data)
        let sceneCompletion: SceneHandlerCompletion = null
        if (await this.validateUserCanUseScene(ctx, data, currentScene)) {
            logger.log(
                `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
            )
            sceneCompletion = await currentScene.handleCallback(ctx, callbackData)
            data = await this.getHandlingTransactionUserData(ctx)

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

        let nextSceneName: SceneName = sceneCompletion?.nextSceneNameIfCompleted
        let nextScene: IScene = null
        let didStartedAnyScene = false
        while (nextSceneName) {
            nextScene = this.createSceneWith(nextSceneName, data)

            if (await this.validateUserCanUseScene(ctx, data, nextScene, false)) {
                sceneCompletion = await nextScene.handleEnterScene(ctx)
                data = await this.getHandlingTransactionUserData(ctx)
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
                    data: sceneCompletion.sceneData,
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

    private getSceneNameFromCompletion(sceneCompletion?: SceneHandlerCompletion): SceneName | null {
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

    private createSceneWith(name: SceneName, data: TransactionUserData): IScene {
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
        ctx: Context,
        data: TransactionUserData,
        scene?: IScene,
        needToSendMessage: boolean = true
    ): Promise<boolean> {
        if (!scene) return false
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

    private async getHandlingTransactionUserData(
        ctx: Context<Update>
    ): Promise<TransactionUserData> {
        const user = await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
        })
        const userActivePermissions = getActiveUserPermissions(user)

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
    userActivePermissions: UserPermissionNames[]
    userLanguage: string
    botContent: BotContentStable
}

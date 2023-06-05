import { Context } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { IDispatcher } from '../dispatcher.interface'
import { BotContentService } from 'src/core/bot-content/bot-content.service'
import { UserService } from 'src/core/user/user.service'
import { IScene, SceneHandlerCompletion } from 'src/presentation/scenes/scene.interface'
import { OnboardingScene } from 'src/presentation/scenes/implementations/onboarding.scene'
import { SceneName } from 'src/presentation/scenes/enums/scene-name.enum'
import { MainMenuScene } from 'src/presentation/scenes/implementations/main-menu.scene'
import { logger } from 'src/app.logger'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { LanguageSupportedKey as LanguageEnum } from 'src/core/bot-content/language-supported-key.enum'
import { BotContent, BotContentStable } from 'src/core/bot-content/schemas/bot-content.schema'
import { User, UserDocument } from 'src/core/user/schemas/user.schema'
import { content } from 'googleapis/build/src/apis/content'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'
import { Message } from 'typegram'

export class PrivateDialogDispatcher implements IDispatcher {
    // =====================
    // Properties
    // =====================

    private readonly startSceneName: SceneName = SceneName.onboarding
    private readonly defaultSceneName: SceneName = SceneName.mainMenu

    constructor(
        private readonly botContentService: BotContentService,
        private readonly userService: UserService
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
            },
        })

        await this.userService.logToUserHistory(user, UserHistoryEvent.start, startParam)

        const userLanguage = this.getLanguageFor(user)
        const botContent = await this.botContentService.getContent(userLanguage)
        const startScene = this.createSceneWith(this.startSceneName, user, botContent)
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

        // TODO: log to user history
        await this.userService.logToUserHistory(data.user, UserHistoryEvent.sendMessage)

        // TODO: get bot content for user language

        // =====================
        // Try to find current scene
        // =====================
        const sceneName = SceneName[data.user.sceneData?.sceneName]
        const currentScene = this.createSceneWith(sceneName, data.user, data.botContent)
        let sceneCompletion: SceneHandlerCompletion = null
        if (this.validateUserCanUseScene(ctx, data.userActivePermissions, data.botContent, currentScene)) {
            logger.log(
                `${currentScene.name} handleMessage. User: ${ctx.from.id} ${ctx.from.username}`
            )
            sceneCompletion = await currentScene.handleMessage(ctx, data.user.sceneData.data)
            data = await this.getHandlingTransactionUserData(ctx)
        }

        // =====================
        // Start next scene if needed
        // =====================        
        let nextScene: IScene
        if (sceneCompletion) {
            if (sceneCompletion.inProgress === false) {
                // Exit from current scene
                if (sceneCompletion?.nextSceneNameIfCompleted) {
                    // Next scene is specified
                    nextScene = this.createSceneWith(
                        sceneCompletion.nextSceneNameIfCompleted,
                        data.user,
                        data.botContent
                    )
                }
                // Next scene is not specified check
                nextScene =
                    nextScene ?? this.createSceneWith(this.defaultSceneName, data.user, data.botContent)
            }
        } else {
            // May happens only during tests after db clearing
            // when the user created without /start and already sent a message
            nextScene = this.createSceneWith(this.defaultSceneName, data.user, data.botContent)
        }
        if (this.validateUserCanUseScene(ctx, data.userActivePermissions, data.botContent, nextScene)) {
            sceneCompletion = await nextScene.handleEnterScene(ctx)
            data = await this.getHandlingTransactionUserData(ctx)
        }

        // Send canNonHandle message
        if (sceneCompletion.didHandledUserInteraction !== true) {
            ctx.replyWithMarkdownV2(data.botContent.uniqueMessage.unknownState)
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
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private createSceneWith(name: SceneName, user: UserDocument, botContent: BotContent): IScene {
        // TODO: implement auto scene including
        switch (name) {
            case SceneName.mainMenu:
                return new MainMenuScene(botContent, user, this.userService)
            case SceneName.onboarding:
                return new OnboardingScene(botContent, user, this.userService)
            case SceneName.adminMenu:
                return new MainMenuScene(botContent, user, this.userService)
            default:
                return new MainMenuScene(botContent, user, this.userService)
        }
    }

    private getLanguageFor(user: UserDocument): LanguageEnum {
        return (
            user.internalInfo?.language ??
            LanguageEnum[user.telegramInfo.language_code] ??
            LanguageEnum.ru
        )
    }

    private getActiveUserPermissions(user: UserDocument): UserPermissions[] {
        return (
            user.internalInfo?.permissions
                ?.map((permission) => {
                    if (permission.expirationDate < new Date()) {
                        return undefined
                    }
                    return permission?.permissionName ?? undefined
                })
                .filter((x) => !!x) ?? []
        )
    }

    private validateUserCanUseScene(
        ctx: Context,
        userActivePermissions: UserPermissions[],
        botContent: BotContentStable,
        scene?: IScene
    ): boolean {
        if (!scene) {
            return false
        }
        const validationResult = scene.validateUseScenePermissions(userActivePermissions)
        if (validationResult.canUseScene) {
            return true
        } else {
            ctx.replyWithMarkdownV2(validationResult.validationErrorMessage ?? 'JOPA')
            return false
        }
    }

    private async getHandlingTransactionUserData(ctx: Context<Update>): Promise<TransactionUserData> {
        let user = await this.userService.createIfNeededAndGet({
            telegramId: ctx.from.id,
            telegramInfo: ctx.from,
        })
        let userActivePermissions = this.getActiveUserPermissions(user)

        let userLanguage = this.getLanguageFor(user)
        let botContent = await this.botContentService.getContent(userLanguage)

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
    userActivePermissions:  UserPermissions[]
    userLanguage: LanguageEnum
    botContent: BotContentStable
}

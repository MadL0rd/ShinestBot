import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { Markup, Context } from 'telegraf'
import { Update } from 'telegraf/types'
import { SceneCallbackData } from '../../models/scene-callback'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { Scene } from '../../models/scene.abstract'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'
import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'
import { UserProfile } from 'src/entities/user-profile'

// =====================
// Scene data classes
// =====================
export class AdminMenuUsersManagementSceneSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuUsersManagement'
}
type SceneEnterDataType = AdminMenuUsersManagementSceneSceneEntranceDto
interface ISceneData {
    targetUserTelegramId?: number
    editPermissionsModeEnabled?: boolean | null
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuUsersManagementSceneScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'adminMenuUsersManagement'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(protected readonly userService: UserService) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(
        ctx: Context,
        data?: SceneEnterDataType
    ): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory({ type: 'startSceneAdminMenuUsersManagementScene' })

        await ctx.replyWithHTML(
            this.text.adminMenu.usersManagementTextFindUser,
            Markup.removeKeyboard()
        )

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})
        const messageText = message?.text

        const data = this.restoreData(dataRaw)

        if (data.targetUserTelegramId == null) {
            let targetUser: UserProfileDocument | null = null
            if (messageText.includes('@', 0)) {
                targetUser = await this.userService.findByTelegramUsername(messageText)
            } else if (parseInt(messageText)) {
                const targetUserTelegramId = parseInt(messageText)
                targetUser = await this.userService.findOneByTelegramId(targetUserTelegramId)
            }

            if (targetUser) {
                await ctx.replyWithHTML(
                    `Найден пользователь: \n${this.generateUserInfoString(targetUser)}`,
                    this.keyboardMarkupWithAutoLayoutFor([
                        this.text.adminMenu.usersManagementButtonEditPermissions,
                        this.text.adminMenu.usersManagementButtonNewSearch,
                        this.text.adminMenu.returnBack,
                    ])
                )
                data.targetUserTelegramId = targetUser.telegramId
                return this.completion.inProgress(data)
            } else {
                await ctx.replyWithHTML('Не удалось найти пользователя')
                await ctx.replyWithHTML(
                    this.text.adminMenu.usersManagementTextFindUser,
                    Markup.removeKeyboard()
                )
                return this.completion.inProgress(data)
            }
        }

        if (data.editPermissionsModeEnabled == null) {
            switch (messageText) {
                case this.text.adminMenu.usersManagementButtonEditPermissions:
                    const targetUser = await this.userService.findOneByTelegramId(
                        data.targetUserTelegramId
                    )
                    if (targetUser != null) {
                        const targetUserActivePermissions =
                            UserProfile.Helper.getActivePermissionNames(targetUser)
                        const buttons: string[] = []
                        for (const permission of UserProfile.PermissionNames.allCases) {
                            const permissionValue = permission
                            const prefix = targetUserActivePermissions.includes(permissionValue)
                                ? '✅'
                                : '❌'
                            buttons.push(`${prefix} ${permission}`)
                        }
                        buttons.push(this.text.common.buttonBackToPreviousMenu)
                        await ctx.replyWithHTML(
                            this.text.adminMenu.usersManagementPermissionsInfo,
                            this.keyboardMarkupWithAutoLayoutFor(buttons)
                        )
                        data.editPermissionsModeEnabled = true
                        return this.completion.inProgress(data)
                    }
                    break
                case this.text.adminMenu.usersManagementButtonNewSearch:
                    await ctx.replyWithHTML(
                        this.text.adminMenu.usersManagementTextFindUser,
                        Markup.removeKeyboard()
                    )
                    return this.completion.inProgress({})

                case this.text.adminMenu.returnBack:
                    return this.completion.complete({ sceneName: 'adminMenu' })
            }
        }

        if (data.editPermissionsModeEnabled == true) {
            switch (messageText) {
                case this.text.common.buttonBackToPreviousMenu:
                    const targetUser = await this.userService.findOneByTelegramId(
                        data.targetUserTelegramId
                    )
                    if (targetUser != null) {
                        await ctx.replyWithHTML(
                            `Найден пользователь: \n${this.generateUserInfoString(targetUser)}`,
                            this.keyboardMarkupWithAutoLayoutFor([
                                this.text.adminMenu.usersManagementButtonEditPermissions,
                                this.text.adminMenu.usersManagementButtonNewSearch,
                                this.text.adminMenu.returnBack,
                            ])
                        )
                        data.editPermissionsModeEnabled = null
                        return this.completion.inProgress(data)
                    }
            }

            if (messageText.split(' ').length != 2) {
                return this.completion.canNotHandle(data)
            }
            const targetPermission = messageText.split(' ')[1]

            if (!UserProfile.PermissionNames.includes(targetPermission)) {
                return this.completion.canNotHandle(data)
            }
            let permissionUpdateEnable = false

            let targetUserActivePermissions: string[] | null = null
            const targetUser = await this.userService.findOneByTelegramId(data.targetUserTelegramId)
            if (targetUser) {
                targetUserActivePermissions =
                    UserProfile.Helper.getActivePermissionNames(targetUser)
            }

            // Include only enabled actions
            switch (targetPermission) {
                // Any actions with owner can do only developer
                case 'owner':
                    break

                // Only owner can set admin permission
                case 'admin':
                    if (this.userActivePermissions.includes('owner')) {
                        permissionUpdateEnable = true
                    }
                    break

                // Owner and admin can ban user
                // Nobody can ban owner and admin
                case 'banned':
                    if (
                        targetUserActivePermissions &&
                        targetUserActivePermissions.includes('owner') == false &&
                        targetUserActivePermissions.includes('admin') == false
                    ) {
                        permissionUpdateEnable = true
                    }
                    break

                // Other actions from admin and owner are enabled
                default:
                    permissionUpdateEnable = true
            }

            if (permissionUpdateEnable == false) {
                await ctx.replyWithHTML('Вам не хватает прав чтобы совершить данное действие')
                return this.completion.inProgress(data)
            }

            if (
                targetUser &&
                targetUserActivePermissions &&
                targetUserActivePermissions.includes(targetPermission)
            ) {
                // Remove permission
                targetUser.internalInfo.permissions = targetUser.internalInfo.permissions.filter(
                    (permission) => permission.permissionName != targetPermission
                )
            } else {
                // Add permission
                if (targetUser && targetUser.internalInfo.permissions) {
                    targetUser.internalInfo.permissions.push({
                        permissionName: targetPermission,
                        startDate: new Date(),
                    })
                } else if (targetUser) {
                    targetUser.internalInfo.permissions = [
                        {
                            permissionName: targetPermission,
                            startDate: new Date(),
                        },
                    ]
                }
            }
            if (targetUser) {
                await this.userService.update(targetUser)

                await ctx.replyWithHTML(
                    `Найден пользователь: \n${this.generateUserInfoString(targetUser)}`,
                    this.keyboardMarkupWithAutoLayoutFor([
                        this.text.adminMenu.usersManagementButtonEditPermissions,
                        this.text.adminMenu.usersManagementButtonNewSearch,
                        this.text.adminMenu.returnBack,
                    ])
                )
                data.editPermissionsModeEnabled = null
                return this.completion.inProgress(data)
            }
        }

        return this.completion.canNotHandle(data)
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
    private generateUserInfoString(user: UserProfileDocument): string {
        let result: string = ''
        result += `\nTelegram id: *${user.telegramId}*`
        result += `\nTelegram username: *@${user.telegramInfo.username}*`
        result += `\n\nМодификаторы доступа:\n`
        for (const permission of user.internalInfo.permissions ?? []) {
            result += `\n*${permission.permissionName}*`
            result += `\nВыдан: ${permission.startDate ?? 'Неизвестно'}`
            result += `\nИстекает: ${permission.expirationDate ?? 'Никогда'}`
            result += '\n'
        }

        return replaceMarkdownWithHtml(result)
    }
}

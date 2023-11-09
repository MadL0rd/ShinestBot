import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../../enums/scene-name.enum'
import {
    SceneHandlerCompletion,
    Scene,
    PermissionsValidationResult,
    SceneCallbackData,
} from '../../scene.interface'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { UserDocument } from 'src/core/user/schemas/user.schema'
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'
import { UserPermissions } from 'src/core/user/enums/user-permissions.enum'
import { getActiveUserPermissions } from 'src/utils/getActiveUserPermissions'

// =====================
// Scene data class
// =====================
interface ISceneData {
    targetUserTelegramId?: number
    editPermissionsModeEnabled?: boolean
}

export class AdminMenuUsersManagementScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.adminMenuUsersManagement

    // =====================
    // Public methods
    // =====================

    validateUseScenePermissions(): PermissionsValidationResult {
        const ownerOrAdmin =
            this.userActivePermissions.includes(UserPermissions.admin) ||
            this.userActivePermissions.includes(UserPermissions.owner)
        if (ownerOrAdmin) {
            return { canUseScene: true }
        }
        return { canUseScene: false }
    }

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenuUsersManagement)

        await ctx.replyWithHTML(
            this.text.adminMenu.usersManagementTextFindUser,
            Markup.removeKeyboard()
        )

        return this.completion.inProgress(this.generateData({}))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        const data = this.restoreData(dataRaw)
        const message = ctx.message as Message.TextMessage
        const messageText = message?.text

        if (messageText == null) {
            return this.completion.canNotHandle(data)
        }

        if (data.targetUserTelegramId == null) {
            let targetUser: UserDocument
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
                    const targetUserActivePermissions = getActiveUserPermissions(targetUser)
                    const buttons: string[] = []
                    for (const permission in UserPermissions) {
                        const permissionValue = UserPermissions[permission]
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

                case this.text.adminMenu.usersManagementButtonNewSearch:
                    await ctx.replyWithHTML(
                        this.text.adminMenu.usersManagementTextFindUser,
                        Markup.removeKeyboard()
                    )
                    return this.completion.inProgress()

                case this.text.adminMenu.returnBack:
                    return this.completion.complete(SceneName.adminMenu)
            }
        }

        if (data.editPermissionsModeEnabled == true) {
            switch (messageText) {
                case this.text.common.buttonBackToPreviousMenu:
                    const targetUser = await this.userService.findOneByTelegramId(
                        data.targetUserTelegramId
                    )
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

            if (messageText.split(' ').length != 2) {
                return this.completion.canNotHandle(data)
            }
            const targetPermission = UserPermissions[messageText.split(' ')[1]]
            if (targetPermission == null) {
                return this.completion.canNotHandle(data)
            }
            let permissionUpdateEnable = false

            const targetUser = await this.userService.findOneByTelegramId(data.targetUserTelegramId)
            const targetUserActivePermissions = getActiveUserPermissions(targetUser)

            // Include only enabled actions
            switch (targetPermission) {
                // Any actions with owner can do only developer
                case UserPermissions.owner:
                    break

                // Only owner can set admin permission
                case UserPermissions.admin:
                    if (this.userActivePermissions.includes(UserPermissions.owner)) {
                        permissionUpdateEnable = true
                    }
                    break

                // Owner and admin can ban user
                // Nobody can ban owner and admin
                case UserPermissions.banned:
                    if (
                        targetUserActivePermissions.includes(UserPermissions.owner) == false &&
                        targetUserActivePermissions.includes(UserPermissions.admin) == false
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

            if (targetUserActivePermissions.includes(targetPermission)) {
                // Remove permission
                targetUser.internalInfo.permissions = targetUser.internalInfo.permissions.filter(
                    (permission) => UserPermissions[permission.permissionName] != targetPermission
                )
            } else {
                // Add permission
                if (targetUser.internalInfo.permissions) {
                    targetUser.internalInfo.permissions.push({
                        permissionName: targetPermission,
                        startDate: new Date(),
                    })
                } else {
                    targetUser.internalInfo.permissions = [
                        {
                            permissionName: targetPermission,
                            startDate: new Date(),
                        },
                    ]
                }
            }
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

        return this.completion.canNotHandle(data)
    }

    async handleCallback(
        ctx: Context<Update>,
        data: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private generateUserInfoString(user: UserDocument): string {
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

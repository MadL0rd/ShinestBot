import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserService } from 'src/business-logic/user/user.service'
import { UserProfile } from 'src/entities/user-profile'
import { replaceMarkdownWithHtml } from 'src/utils/replace-markdown-with-html'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../../models/scene-entrance.interface'
import { SceneName } from '../../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../../models/scene-usage-permissions-validator'
import { Scene } from '../../models/scene.abstract'
import { SceneHandlerCompletion } from '../../models/scene.interface'
import { InjectableSceneConstructor } from '../../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================
export class AdminMenuUserPermissionsEditorSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuUserPermissionsEditor'
    readonly targetUserTelegramId: number
}
type SceneEnterDataType = AdminMenuUserPermissionsEditorSceneEntranceDto
type ISceneData = {
    targetUserTelegramId: number
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuUserPermissionsEditorScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuUserPermissionsEditor'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(protected override readonly userService: UserService) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        if (!data?.targetUserTelegramId)
            return this.completion.complete({ sceneName: 'adminMenuUsersManagement' })

        return this.initDefaultState(data)
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const targetUser = await this.userService.findOneByTelegramId(data.targetUserTelegramId)
        if (!targetUser) return this.completion.complete({ sceneName: 'adminMenuUsersManagement' })

        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        // Handle navigation buttons
        switch (message.text) {
            case this.text.common.buttonBackToPreviousMenu:
                return targetUser
                    ? this.completion.complete({
                          sceneName: 'adminMenuUsersManagement',
                          targetUserTelegramId: targetUser.telegramId,
                      })
                    : this.completion.complete({ sceneName: 'adminMenu' })

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                break
        }

        // Handle permission buttons
        const targetPermission = message.text.split(' ')[1]
        if (!UserProfile.PermissionNames.includes(targetPermission)) {
            return this.completion.canNotHandle()
        }
        let permissionUpdateEnable = false

        const targetUserAccessRules = UserProfile.Helper.getUserAccessRules(targetUser.permissions)

        // Include only enabled actions
        switch (targetPermission) {
            // Any actions with owner can do only developer
            case 'owner':
                break

            // Only owner can set admin permission
            case 'admin':
                if (this.userAccessRules.canAppointAdmins) permissionUpdateEnable = true
                break

            // Owner and admin can ban user
            // Nobody can ban owner and admin
            case 'banned':
                if (targetUserAccessRules.canBeBanned) permissionUpdateEnable = true
                break

            // Other actions from admin and owner are enabled
            default:
                permissionUpdateEnable = true
        }

        if (permissionUpdateEnable === false) {
            await this.ddi.sendHtml('Вам не хватает прав чтобы совершить данное действие')
            return this.completion.inProgress(data)
        }

        if (targetUserAccessRules.activePermissionNames.includes(targetPermission)) {
            // Remove permission
            targetUser.permissions = targetUser.permissions.filter(
                (permission) => permission.permissionName != targetPermission
            )
        } else {
            // Add permission
            targetUser.permissions.push({
                permissionName: targetPermission,
                startDate: new Date(),
            })
        }

        await this.userService.update(targetUser, ['permissions'])

        return this.initDefaultState(data)
    }

    // =====================
    // Private methods
    // =====================

    private async initDefaultState(data: ISceneData): Promise<SceneHandlerCompletion> {
        const targetUser = await this.userService.findOneByTelegramId(data.targetUserTelegramId)
        if (!targetUser) return this.completion.complete({ sceneName: 'adminMenuUsersManagement' })

        const targetUserActivePermissions = UserProfile.Helper.getActivePermissionNames(
            targetUser.permissions
        )
        const buttons: string[] = []
        for (const permission of UserProfile.PermissionNames.allCases) {
            const permissionValue = permission
            const prefix = targetUserActivePermissions.includes(permissionValue) ? '✅' : '❌'
            buttons.push(`${prefix} ${permission}`)
        }
        buttons.push(this.text.common.buttonBackToPreviousMenu)
        await this.ddi.sendHtml(
            this.text.adminMenuUsersManagement.usersManagementPermissionsInfo,
            this.keyboardMarkupWithAutoLayoutFor(buttons)
        )

        return this.completion.inProgress(data)
    }

    private generateUserInfoString(user: UserProfileDocument): string {
        const resultLines: string[] = []
        resultLines.push(`\nTelegram id: <b>${user.telegramId}</b>`)
        resultLines.push(`Telegram username: <b>@${user.telegramInfo.username}</b>`)
        resultLines.push(`\nМодификаторы доступа:\n`)
        for (const permission of user.permissions ?? []) {
            resultLines.push(`<b>${permission.permissionName}</b>`)
            resultLines.push(`Выдан: ${permission.startDate ?? 'Неизвестно'}`)
            resultLines.push(`Истекает: ${permission.expirationDate ?? 'Никогда'}`)
            resultLines.push('')
        }

        return replaceMarkdownWithHtml(resultLines.join('\n'))
    }
}

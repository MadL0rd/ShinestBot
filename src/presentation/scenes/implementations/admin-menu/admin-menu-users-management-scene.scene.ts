import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
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
export class AdminMenuUsersManagementSceneSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuUsersManagement'
    readonly targetUserTelegramId?: number
}
type SceneEnterDataType = AdminMenuUsersManagementSceneSceneEntranceDto
type ISceneData = {
    targetUserTelegramId?: number
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuUsersManagementSceneScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'adminMenuUsersManagement'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.OwnerOrAdminOnly()
    }

    constructor(
        protected override readonly userService: UserService,
        private readonly chainTasksService: ChainTasksService
    ) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        return await this.initState(data ?? {})
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const targetUser = data.targetUserTelegramId
            ? await this.userService.findOneByTelegramId(data.targetUserTelegramId)
            : null

        return !targetUser ? this.handleUserSearch(ctx) : this.handleUserManagement(ctx, targetUser)
    }

    // =====================
    // Private methods
    // =====================

    private async initState(data: ISceneData): Promise<SceneHandlerCompletion> {
        const targetUser = data.targetUserTelegramId
            ? await this.userService.findOneByTelegramId(data.targetUserTelegramId)
            : null

        // Search state
        if (!targetUser) {
            await this.ddi.sendHtml(
                this.text.adminMenuUsersManagement.textFindUser,
                this.keyboardMarkupWithAutoLayoutFor([
                    this.text.adminMenuUsersManagement.buttonSelectMyAccount,
                    this.text.adminMenu.returnBack,
                ])
            )

            return this.completion.inProgress({})
        }

        const userTasksQueueInfo = await this.chainTasksService.getUserTasksQueueInfo(
            this.user.telegramId
        )

        // Action select state
        const emptyValue = 'Отсутствует'
        await this.ddi.sendHtml(
            this.text.adminMenuUsersManagement.textSelectedUserInfo({
                firstAndLastNames: `${targetUser.telegramInfo.first_name ?? ''} ${targetUser.telegramInfo.last_name ?? ''}`,
                telegramId: targetUser.telegramId,
                telegramUsername: targetUser.telegramInfo.username
                    ? `@${targetUser.telegramInfo.username}`
                    : emptyValue,
                activePermissions:
                    UserProfile.Helper.getActivePermissionNames(targetUser).join(', '),
                enableStartParamRewriting: targetUser.enableStartParamRewriting ? 'Да' : 'Нет',
                chainTasksQueueIsIssued: userTasksQueueInfo.isIssued ? 'Да' : 'Нет',
                chainTasksCount: userTasksQueueInfo.count,
            }),
            {
                reply_markup: this.keyboardMarkup([
                    this.text.adminMenuUsersManagement.buttonEditPermissions,
                    this.text.adminMenuUsersManagement.buttonRestoreTopic,
                    this.text.adminMenuUsersManagement.buttonEnableStartParamRewriting,
                    this.text.adminMenuUsersManagement.buttonNewSearch,
                    this.text.adminMenu.returnBack,
                ]).reply_markup,
                link_preview_options: { is_disabled: true },
            }
        )

        return this.completion.inProgress(data)
    }

    async handleUserSearch(ctx: ExtendedMessageContext): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()
        const messageText = message.text

        switch (messageText) {
            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            case this.text.adminMenuUsersManagement.buttonSelectMyAccount:
                return this.initState({ targetUserTelegramId: this.user.telegramId })

            default: {
                let targetUser: UserProfileDocument | null = null
                if (messageText.startsWith('@')) {
                    targetUser = await this.userService.findByTelegramUsername(messageText)
                } else if (parseInt(messageText)) {
                    const targetUserTelegramId = parseInt(messageText)
                    targetUser = await this.userService.findOneByTelegramId(targetUserTelegramId)
                }

                if (targetUser) {
                    return this.initState({ targetUserTelegramId: targetUser.telegramId })
                }

                await this.ddi.sendHtml(this.text.adminMenuUsersManagement.textCannotFindUser)
                return this.completion.inProgress({})
            }
        }
    }

    async handleUserManagement(
        ctx: ExtendedMessageContext,
        targetUser: UserProfileDocument
    ): Promise<SceneHandlerCompletion> {
        const message = ctx.message
        if (message.type !== 'text') {
            return this.completion.canNotHandle()
        }
        const messageText = message.text

        switch (messageText) {
            case this.text.adminMenuUsersManagement.buttonEditPermissions:
                return this.completion.complete({
                    sceneName: 'adminMenuUserPermissionsEditor',
                    targetUserTelegramId: targetUser.telegramId,
                })

            case this.text.adminMenuUsersManagement.buttonRestoreTopic: {
                await this.chainTasksService.addTask({
                    userTelegramId: targetUser.telegramId,
                    action: {
                        resourceType: 'telegram',
                        actionType: 'createTopic',
                        topicType: 'default',
                    },
                })
                await this.ddi.sendHtml(
                    'Запрос на создание нового топика для пользователя был получен, ожидайте его появление в соответствующем форуме'
                )
                return this.initState({ targetUserTelegramId: targetUser.telegramId })
            }

            case this.text.adminMenuUsersManagement.buttonEnableStartParamRewriting: {
                const accessRules = UserProfile.Helper.getUserAccessRules(targetUser)
                if (accessRules.canBeUsedForStartParamRewriting.isFalse) {
                    await this.ddi.sendHtml(
                        `Эту функцию можно применить только к пользователям с правами доступа 'admin' или 'owner'`
                    )
                    return this.initState({ targetUserTelegramId: targetUser.telegramId })
                }
                await this.userService.update({
                    telegramId: targetUser.telegramId,
                    enableStartParamRewriting: this.user.enableStartParamRewriting ? false : true,
                })
                return this.initState({ targetUserTelegramId: targetUser.telegramId })
            }

            case this.text.adminMenuUsersManagement.buttonNewSearch:
                return this.initState({})

            case this.text.adminMenu.returnBack:
                return this.completion.complete({ sceneName: 'adminMenu' })

            default:
                return this.completion.canNotHandle()
        }
    }

    // =====================
    // Scene utils
    // =====================
    private generateUserInfoString(user: UserProfileDocument): string {
        let result: string = ''
        result += `\nИмя: `
        result += `\nTelegram id: <b>${user.telegramId}</b>`
        result += `\nTelegram username: <b>@${user.telegramInfo.username}</b>`

        return replaceMarkdownWithHtml(result)
    }
}

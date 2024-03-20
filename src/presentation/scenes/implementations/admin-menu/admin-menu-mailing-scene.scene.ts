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
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'
import { UserHistoryEvent } from 'src/business-logic/user/enums/user-history-event.enum'

// =====================
// Scene data classes
// =====================
export class AdminMenuMailingSceneSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'adminMenuMailingScene'
}
type SceneEnterDataType = AdminMenuMailingSceneSceneEntranceDto
interface ISceneData {
    mailingMessageText?: string
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class AdminMenuMailingSceneScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName.Union = 'adminMenuMailingScene'
    protected get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
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
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenuMailingScene)

        await ctx.replyWithHTML(this.text.adminMenu.mailingText, Markup.removeKeyboard())

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const data = this.restoreData(dataRaw)
        const message = ctx.message
        if (!message || !('text' in message)) return this.completion.canNotHandle({})
        if (!ctx.chat) return this.completion.canNotHandle({})

        logger.log(`${data}`)
        if (data.mailingMessageText == null) {
            const mailingMessageText = replaceMarkdownWithHtml(message.text)
            data.mailingMessageText = mailingMessageText
            logger.log(`${data}, mailingMessageText: ${mailingMessageText}`)
            await ctx.replyWithHTML(
                data.mailingMessageText,
                this.keyboardMarkupWithAutoLayoutFor([
                    this.text.adminMenu.mailingButtonSend,
                    this.text.adminMenu.mailingButtonCancel,
                ])
            )
            return this.completion.inProgress(data)
        } else {
            switch (message.text) {
                case this.text.adminMenu.mailingButtonSend:
                    const allUsersTelegramIdList = await this.userService.findAllTelegramIds()
                    const adminMessage = await ctx.replyWithHTML(
                        `Отправлено сообщений: 0/${allUsersTelegramIdList.length}\nПользователей заблокировало бота: 0`
                    )

                    let blockedUsersCount = 0
                    for (const [index, userId] of allUsersTelegramIdList.entries()) {
                        try {
                            await ctx.telegram.sendMessage(userId, data.mailingMessageText, {
                                parse_mode: 'HTML',
                            })
                        } catch (e) {
                            blockedUsersCount += 1

                            const user = await this.userService.findOneByTelegramId(userId)
                            if (!user) {
                                logger.log(`Пользователь ${userId} не найден!`)
                                continue
                            }
                            await this.userService.logToUserHistory(
                                user,
                                UserHistoryEvent.botIsBlockedDetected
                            )
                        }
                        if (index % 10 == 0) {
                            await ctx.telegram.editMessageText(
                                ctx.chat.id,
                                adminMessage.message_id,
                                undefined,
                                `Отправлено сообщений: ${index + 1 - blockedUsersCount}/${
                                    allUsersTelegramIdList.length
                                }\nПользователей заблокировало бота: ${blockedUsersCount}`,
                                {
                                    parse_mode: 'HTML',
                                }
                            )
                        }
                    }

                    if (ctx.chat) {
                        await ctx.telegram.editMessageText(
                            ctx.chat.id,
                            adminMessage.message_id,
                            undefined,
                            `Отправлено сообщений: ${
                                allUsersTelegramIdList.length - blockedUsersCount
                            }/${
                                allUsersTelegramIdList.length
                            }\nПользователей заблокировало бота: ${blockedUsersCount}\nОтправка завершена!`,
                            {
                                parse_mode: 'HTML',
                            }
                        )
                    }

                    return this.completion.complete({ sceneName: 'adminMenu' })

                case this.text.adminMenu.mailingButtonCancel:
                    return this.completion.complete({ sceneName: 'adminMenu' })
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
}

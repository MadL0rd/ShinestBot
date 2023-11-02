import { Context } from 'telegraf'
import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../../scene.interface'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'
import { replaceMarkdownWithHtml } from 'src/utils/replaceMarkdownWithHtml'
import { UserHistoryEvent } from 'src/core/user/enums/user-history-event.enum'

// =====================
// Scene data class
// =====================
interface ISceneData {
    mailingMessageText?: string
}

export class AdminMenuMailingScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.adminMenuMailing

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`)
        await this.logToUserHistory(this.historyEvent.startSceneAdminMenuMailing)

        await ctx.replyWithHTML(this.text.adminMenu.mailingText, Markup.removeKeyboard())

        return this.completion.inProgress(this.generateData({}))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        const data = this.restoreData(dataRaw)
        const message = ctx.message as Message.TextMessage

        if (message === null) {
            return this.completion.canNotHandle(data)
        }

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

                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        adminMessage.message_id,
                        undefined,
                        `Отправлено сообщений: ${
                            allUsersTelegramIdList.length - blockedUsersCount
                        }/${
                            allUsersTelegramIdList.length
                        }\nПользователей заблокировало бота: ${blockedUsersCount}`,
                        {
                            parse_mode: 'HTML',
                        }
                    )

                    return this.completion.complete(SceneName.adminMenu)

                case this.text.adminMenu.mailingButtonCancel:
                    return this.completion.complete(SceneName.adminMenu)
            }
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
}

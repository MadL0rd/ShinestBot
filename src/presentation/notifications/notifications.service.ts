import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectBot } from 'nestjs-telegraf'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { GptApiService } from 'src/business-logic/gpt-api/gpt-api.service'
import { UserService } from 'src/business-logic/user/user.service'
import { SceneCallbackAction } from 'src/presentation/scenes/models/scene-callback'
import { Context, Telegraf } from 'telegraf'
import { InlineKeyboardButton } from 'node_modules/telegraf/typings/core/types/typegram'
import { generateInlineButtonSegue } from '../utils/inline-button.utils'
import { BotContent } from 'src/entities/bot-content'

@Injectable()
export class NotificationsService {
    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly botContentService: BotContentService,
        private readonly userService: UserService,
        private readonly gptService: GptApiService
    ) {}

    @Cron('0 */30 * * * *')
    async morningNotification() {
        const dateFormat = 'HH:mm'
        const thisDatetime = new Date()
        const thisTime = thisDatetime.formattedWithAppTimeZone(dateFormat)

        const content = await this.getBotContent()
        const text = content.uniqueMessage
        const morningTimeList = text.notification.morningTimeList.split('\n')

        if (!morningTimeList.includes(thisTime)) return
        logger.log(`Start sending morning notification`)

        let notificationText = await this.gptService.gptAnswer([
            {
                role: `system`,
                text: text.notification.morningTextGptPromt,
            },
        ])
        if (!notificationText) notificationText = text.notification.morningTextDefault
        notificationText = notificationText.replaceAll(`"`, ``)

        for (const tgId of await this.userService.findAllTelegramIds()) {
            const user = await this.userService.findOneByTelegramId(tgId)
            if (!user) continue

            const userTime =
                user.internalInfo?.notificationsSchedule.morning ??
                text.notification.morningTimeDefault
            if (userTime !== thisTime || userTime == text.notification.buttonDontSend) continue
            logger.log(`Morning notification to user ${user.telegramInfo.username}`)
            const inlineKeyboard: InlineKeyboardButton[][] = []
            inlineKeyboard.push([
                generateInlineButtonSegue({
                    text: text.notification.buttonMainMenu,
                    action: SceneCallbackAction.segueButton,
                    data: {
                        segueSceneName: 'mainMenu',
                    },
                }),
            ])
            try {
                await this.bot.telegram.sendMessage(user.telegramId, notificationText, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: inlineKeyboard,
                    },
                })
            } catch (error) {
                logger.warn(
                    `Failed to send morning notification to user ${user.telegramInfo.username}`,
                    error
                )
                this.userService.logToUserHistory(user, { type: 'botIsBlockedDetected' })
            }
        }
    }

    @Cron('0 */30 * * * *')
    async eveningNotification() {
        const dateFormat = 'HH:mm'
        const thisDatetime = new Date()
        const thisTime = thisDatetime.formattedWithAppTimeZone(dateFormat)

        const content = await this.getBotContent()
        const text = content.uniqueMessage
        const eveningTimeList = text.notification.eveningTimeList.split('\n')

        if (!eveningTimeList.includes(thisTime)) return
        logger.log(`Start sending evening notification`)

        let notificationText = await this.gptService.gptAnswer([
            {
                role: 'system',
                text: text.notification.eveningTextGptPromt,
            },
        ])
        if (!notificationText) notificationText = text.notification.eveningTextDefault
        notificationText = notificationText.replaceAll(`"`, ``)

        for (const tgId of await this.userService.findAllTelegramIds()) {
            const user = await this.userService.findOneByTelegramId(tgId)
            if (!user) continue

            const userTime =
                user.internalInfo?.notificationsSchedule.evening ??
                text.notification.eveningTimeDefault
            if (userTime !== thisTime || userTime == text.notification.buttonDontSend) continue
            const inlineKeyboard: InlineKeyboardButton[][] = []
            inlineKeyboard.push([
                generateInlineButtonSegue({
                    text: text.notification.buttonMainMenu,
                    action: SceneCallbackAction.segueButton,
                    data: {
                        segueSceneName: 'mainMenu',
                    },
                }),
            ])
            logger.log(`Evening notification to user ${user.telegramInfo.username}`)
            try {
                await this.bot.telegram.sendMessage(user.telegramId, notificationText, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: inlineKeyboard,
                    },
                })
            } catch (error) {
                logger.warn(
                    `Failed to send evening notification to user ${user.telegramInfo.username}`,
                    error
                )
                this.userService.logToUserHistory(user, { type: 'botIsBlockedDetected' })
            }
        }
    }

    // =====================
    // Private methods
    // =====================

    private async getBotContent(): Promise<BotContent.BaseType> {
        return await this.botContentService.getContent(internalConstants.defaultLanguage)
    }
}

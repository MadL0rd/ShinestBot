import { Injectable } from '@nestjs/common'
import {
    CallbackQuery,
    Update,
    User as UserTelegram,
} from 'node_modules/telegraf/typings/core/types/typegram'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { UserService } from 'src/business-logic/user/user.service'
import { UserProfile } from 'src/entities/user-profile'
import { sceneCallbackDataCompressedSchema } from 'src/presentation/scenes/models/scene-callback'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { Context } from 'telegraf'

namespace TelegramFileTypes {
    export type Union = (typeof allCases)[number]
    export const allCases = [
        'video',
        'videoNote',
        'video_note',
        'photo',
        'audio',
        'document',
        'voice',
    ] as const

    export function includes(value: string | Union): value is Union {
        return allCases.includes(value)
    }
}

@Injectable()
export class StorageChatDispatcherService {
    // =====================
    // Properties
    // =====================

    constructor(
        private readonly userService: UserService,
        private readonly botContentService: BotContentService,
        private readonly mailingService: MailingService
    ) {}

    // =====================
    // Public methods
    // =====================
    async handleUserMessage(ctx: ExtendedMessageContext): Promise<void> {
        const message = ctx.message
        if (!ctx.message) return

        switch (message.type) {
            case 'text': {
                const fileInfo = this.extractFileInfoFromText(message.text)
                if (!fileInfo) return

                const { fileType, fileId } = fileInfo

                try {
                    switch (fileType) {
                        case 'video':
                            await ctx.sendVideo(fileId)
                            return
                        case 'video_note':
                        case 'videoNote':
                            await ctx.sendVideoNote(fileId)
                            return
                        case 'photo':
                            await ctx.sendPhoto(fileId)
                            return
                        case 'audio':
                            await ctx.sendAudio(fileId)
                            return
                        case 'document':
                            await ctx.sendDocument(fileId)
                            return
                        case 'voice':
                            await ctx.sendVoice(fileId)
                            return
                    }
                } catch (e) {
                    logger.warn(`Fail to send file to storage by file id ${fileId}`, e)
                    await ctx.sendMessage('Не удалось отправить файл')
                    return
                }
                break
            }

            case 'photo':
                await ctx.reply(message.photoDefaultSize.file_id)
                break

            case 'video':
                await ctx.reply(message.video.file_id)
                break

            case 'audio':
                await ctx.reply(message.audio.file_id)
                break

            case 'document':
                await ctx.reply(message.document.file_id)
                break

            case 'video_note':
                await ctx.reply(message.video_note.file_id)
                break

            case 'sticker':
                await ctx.reply(message.sticker.file_id)
                break

            case 'voice':
                await ctx.reply(message.voice.file_id)
                break

            default:
                break
        }
    }

    async handleUserCallback(ctx: Context<Update.CallbackQueryUpdate>): Promise<void> {
        const userInfo = await this.getUserInfo(ctx.from).catch(() => null)
        const content = await this.botContentService.getContentForUser(userInfo?.user)

        if (!userInfo || userInfo.accessRules.canManageMailings.isFalse) {
            await ctx.replyWithHTML(content.uniqueMessage.common.permissionDenied)
            return
        }

        const dataQuery = ctx.callbackQuery as CallbackQuery.DataQuery | undefined

        const callbackDataParseResult = sceneCallbackDataCompressedSchema.safeParse(dataQuery?.data)
        const callbackData = callbackDataParseResult.data

        this.userService.logToUserHistory(userInfo.user, {
            type: 'callbackButtonDidTapped',
            data: dataQuery?.data,
            dataParsed: callbackData,
        })

        if (!callbackData) {
            logger.error(
                `Can not parse callback data from ${JSON.stringify(ctx.callbackQuery)}`,
                callbackDataParseResult.error
            )
            return
        }
        logger.log(`Received callback data: ${JSON.stringify(callbackData)}`)

        const supportedActionTypes = [
            'storageChatActionMailingPause',
            'storageChatActionMailingContinue',
            'storageChatActionMailingRemoveMessages',
        ] as const satisfies (typeof callbackData.action.actionType)[]
        type SupportedActionType = (typeof supportedActionTypes)[number]

        if (supportedActionTypes.includes(callbackData.action.actionType) === false) {
            throw Error(
                `Unsupported callback handler for this dispatcher:\n${JSON.stringify(callbackData)}`
            )
        }
        const action = callbackData.action as Extract<
            typeof callbackData.action,
            { actionType: SupportedActionType }
        >

        switch (action.actionType) {
            case 'storageChatActionMailingPause':
                await this.mailingService.pauseMailing(action.data.mId)
                break

            case 'storageChatActionMailingContinue':
                await this.mailingService.continueMailing(action.data.mId)
                break

            case 'storageChatActionMailingRemoveMessages':
                await this.mailingService.removeMailingMessages(action.data.mId)
                break
        }
    }

    /**
     * Try to parse telegram file `type` and `id` to test content sending
     * @param text String on which to perform the search.
     *
     * Sample text:
     * `photo "AgACAgIAAx0CfrIGNAADQWeddTI2waQcYOT4Gd3ooLaCYyYwAAJ88TEb84LoSEW0O-LeQVMiAQADAgADeQADNgQ"`
     */
    private extractFileInfoFromText(text: string): {
        fileType: TelegramFileTypes.Union
        fileId: string
    } | null {
        const textTrimmed = text.trim().replaceAll('"', '')
        const regExpVariants = [
            /([A-Za-z_]{3,20}) ([A-Za-z0-9_-]{70,100})/,
            /([A-Za-z_]{3,20}): ([A-Za-z0-9_-]{70,100})/,
            /([A-Za-z_]{3,20}):([A-Za-z0-9_-]{70,100})/,
        ]

        for (const regExp of regExpVariants) {
            const parseResult = regExp.exec(textTrimmed)
            if (!parseResult) continue

            const { 1: fileType, 2: fileId } = parseResult
            if (TelegramFileTypes.includes(fileType)) {
                return { fileType: fileType, fileId: fileId }
            }
        }

        return null
    }

    private async getUserInfo(telegramUser: UserTelegram) {
        const user = await this.userService.findOneByTelegramId(telegramUser.id)
        if (!user) throw Error(`User profile is not created!\n${JSON.stringify(telegramUser)}`)
        if (user.isBotBlocked || user.telegramUserIsDeactivated) {
            user.isBotBlocked = false
            user.telegramUserIsDeactivated = false
            this.userService.update(user, ['isBotBlocked', 'telegramUserIsDeactivated'])
        }

        return {
            user: user,
            accessRules: UserProfile.Helper.getUserAccessRules(user),
        }
    }
}

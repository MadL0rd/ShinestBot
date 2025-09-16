import { logger } from 'src/app/app.logger'
import { InlineKeyboardButton } from 'telegraf/types'
import { CallbackActionData, compressCallbackData } from '../scenes/models/scene-callback'
import { SceneName } from '../scenes/models/scene-name.enum'

export interface InlineButtonDto {
    text: string
    action: CallbackActionData
}

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 */
export function generateInlineButton(
    button: InlineButtonDto,
    sceneName: SceneName.Union
): InlineKeyboardButton {
    const callbackDataCompressed = compressCallbackData({
        sceneName: sceneName,
        callbackData: button.action,
    })
    const inlineButton: InlineKeyboardButton = {
        text: button.text,
        callback_data: callbackDataCompressed,
    }
    if (callbackDataCompressed.length > 64) {
        logger.error(
            `inlineButton callback data length is ${callbackDataCompressed.length} max length is 64`,
            callbackDataCompressed
        )
    }
    return inlineButton
}

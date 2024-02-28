import { logger } from 'src/app.logger'
import { InlineKeyboardButton } from 'telegraf/types'
import {
    SceneCallbackAction,
    SceneCallbackData,
    SceneCallbackDataSegue,
} from '../scenes/models/scene-callback'
import { SceneName } from '../scenes/models/scene-name.enum'

export interface InlineButtonDto {
    text: string
    action: SceneCallbackAction
    data?: object
}

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 */
export function generateInlineButton(
    button: InlineButtonDto,
    sceneName: SceneName.union
): InlineKeyboardButton {
    const callbackData = new SceneCallbackData(
        SceneName.getId(sceneName),
        button.action,
        button.data ?? {}
    )
    const callbackDataCompressed = callbackData.toString()
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

interface InlineSegueButtonDto {
    text: string
    action: SceneCallbackAction
    data: SceneCallbackDataSegue
}

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 * Segue will be handled in MainMenu
 */
export function generateInlineButtonSegue(button: InlineSegueButtonDto): InlineKeyboardButton {
    return generateInlineButton(button, 'mainMenu')
}

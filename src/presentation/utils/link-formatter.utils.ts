import { internalConstants } from 'src/app/app.internal-constants'
import { BotContent } from 'src/entities/bot-content'

/**
 *
 * @param text some string that contains some redirect link constructors <<linkId:myLink123;utm:utm_source=chat&utm_start=kek>>. myLink123 - redirect link id, utm_source=chat... - utm link end
 * @param telegramIdString user's telegramId or mask
 * @param redirectLinks from bot content
 * @param botSource where this link will be used
 * @returns text with formatted redirect links
 */
export function formatRedirectLinksInText(args: {
    text: string
    telegramIdString: string
    redirectLinks: BotContent.RedirectLinks.BaseType[]
    botSource: BotContent.RedirectLinks.RedirectLinkBotSource
}): string {
    const { text, telegramIdString, redirectLinks, botSource } = args
    const appApiDomain = internalConstants.webhookAndPorts.apiDomain
    const regex = /<<linkId:([^;\s]+);utm:([^>]*)>>/g
    const result = text.replace(regex, (_, linkId, utm) => {
        return redirectLinks.some((link) => link.id === linkId)
            ? utm
                ? `${appApiDomain}/redirect/link/${linkId}?telegramId=${telegramIdString}&utm_bot_source=${botSource}&${utm}`
                : `${appApiDomain}/redirect/link/${linkId}?telegramId=${telegramIdString}&utm_bot_source=${botSource}`
            : ''
    })
    return result
}

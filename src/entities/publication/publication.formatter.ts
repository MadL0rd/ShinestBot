import moment from 'moment'
import { internalConstants } from 'src/app/app.internal-constants'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { Publication } from '.'
import { BotContent } from '../bot-content'
import { UniqueMessage } from '../bot-content/nested/unique-message.entity'
import { Survey } from '../survey'
import { UserProfile } from '../user-profile'

/**
 * Namespace for Publication entity formatter functions.
 * This namespace should contain functions responsible for formatting entity data.
 */
export namespace _PublicationFormatter {
    // Implement your formatter functions here

    export function moderationPreSynchronizedText(
        publication: PublicationDocument,
        text: BotContent.UniqueMessage
    ): string {
        const prefix =
            internalConstants.loadingServiceChatMessagePrefix + publication._id.toString()

        const answersText = Survey.Formatter.generateTextFromPassedAnswers({
            answers: publication.answers,
            text: text,
            filtrationMode: 'allAnswers',
            putIndexes: true,
        })
        return `${prefix}\n\n${answersText}`
    }

    export function moderationSynchronizedText(
        publication: PublicationDocument,
        text: UniqueMessage,
        author: UserProfile.BaseType
    ): string {
        // Head part
        let prefix = `<b>id ${publication._id.toString()}</b>\n`
        prefix += `Автор: ID ${author.telegramId}`
        if (author.telegramInfo.username) prefix += ` @${author.telegramInfo.username}`

        let statusString = publicationStatusString(publication.status, text)
        statusString = `${statusString} #${publication.status}`

        prefix += '\n\n'
        prefix += statusString

        // Content part
        const answersText = Survey.Formatter.generateTextFromPassedAnswers({
            answers: publication.answers,
            text: text,
            filtrationMode: 'allAnswers',
            putIndexes: true,
        })

        const tgLinks = publicationTelegramLinks(publication)
            ?.map((tgLink) =>
                text.moderation.publicationTextLink.replace(
                    text.moderation.messagePostLinkPlaceholder,
                    tgLink
                )
            )
            .join('\n')
        if (tgLinks) prefix += `\n\n${tgLinks}`

        // Footer
        const publicationTagsText = getPublicationTagsString(publication)

        return `${prefix}\n\n${answersText}\n${publicationTagsText}`
    }

    export function makeUserMessageWithPublicationInfo(
        originalText: string,
        publication: PublicationDocument,
        text: UniqueMessage
    ): string {
        const tgPublicationLinkList = publicationTelegramLinks(publication)
        let messageText = originalText + '\n'

        if (tgPublicationLinkList?.isNotEmpty) {
            for (const link of tgPublicationLinkList) {
                messageText +=
                    '\n' +
                    text.moderation.publicationTextLink.replace(
                        text.moderation.messagePostLinkPlaceholder,
                        link
                    )
            }
        }
        const publicationStatus = publicationStatusString(publication.status, text)
        return messageText
            .replace(text.moderation.messageAdvertIdPlaceholder, publication._id.toString())
            .replace(
                text.moderation.messagePostDatePlaceholder,
                moment(publication.creationDate)
                    .utcOffset('Europe/Moscow')
                    .format('DD.MM.yyyy HH:mm')
            )
            .replace(text.moderation.messagePostStatusPlaceholder, publicationStatus)
    }

    export function getPublicationTagsString(publication: PublicationDocument): string {
        return publication.answers
            .compactMap((answer) => {
                if (answer.type != 'options' || !answer.question.useIdAsPublicationTag) {
                    return null
                }
                return `#${answer.selectedOptionId}`
            })
            .join(' ')
    }

    /**
     * Text for public post in main channel
     */
    export function publicationPublicText(
        publication: PublicationDocument,
        text: UniqueMessage
    ): string {
        const publicationText = Survey.Formatter.generateTextFromPassedAnswers({
            answers: publication.answers,
            text: text,
            filtrationMode: 'publicAndSpecified',
            putIndexes: false,
            omitAnswerTyes: ['video', 'image', 'mediaGroup'],
        })

        const publicationTagsText = getPublicationTagsString(publication)
        const statusString = publicationStatusString(publication.status, text)

        const prefix = `<b>${statusString}</b>\n`

        return `${prefix}\n${publicationText}\n\n${publicationTagsText}`
    }

    export function publicationStatusString(
        status: Publication.PublicationStatus.Union,
        text: UniqueMessage
    ): string {
        switch (status) {
            case 'created':
                return text.moderation.publicationStatusCreated
            case 'moderation':
                return text.moderation.publicationStatusModeration
            case 'rejected':
                return text.moderation.publicationStatusRejected
            case 'active':
                return text.moderation.publicationStatusActive
            case 'notRelevant':
                return text.moderation.publicationStatusNotRelevant
        }
    }

    export function publicationTelegramLinks(publication: Publication.BaseType): string[] | null {
        if (publication.placementHistory) {
            return publication.placementHistory.map(
                (event) =>
                    `https://t.me/c/${event.channelId.toString().replace('-100', '')}/${
                        event.messageId
                    }`
            )
        }
        return null
    }
}

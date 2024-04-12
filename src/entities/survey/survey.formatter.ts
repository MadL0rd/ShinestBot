import moment from 'moment'
import { internalConstants } from 'src/app/app.internal-constants'
import { PublicationDocument } from 'src/business-logic/publication-storage/schemas/publication.schema'
import { Survey } from '.'
import { BotContent } from '../bot-content'
import { UniqueMessage } from '../bot-content/nested/unique-message.entity'
import { Publication } from '../publication'
import { UserProfile } from '../user-profile'

/**
 * Namespace for survey entity formatter functions.
 * This namespace should contain functions responsible for formatting entity data.
 */
export namespace _SurveyFormatter {
    export function generateTextFromPassedAnswers(
        answers: Survey.PassedAnswersCache,
        botContent: BotContent.BaseType
    ) {
        const text = botContent.uniqueMessage
        let result = ''
        for (let i = 0; i < answers.passedAnswers.length; i++) {
            const answer = answers.passedAnswers[i]
            const answerStringValue =
                Survey.Helper.getAnswerStringValue(answer, text) ??
                text.surveyFinal.textOptionalAnswerIsNull
            result += `${i + 1}.\t${answer.question.publicTitle}: <b>${answerStringValue}</b>\n`
        }
        return result
    }

    export function moderationPreSynchronizedText(
        publication: PublicationDocument,
        botContent: BotContent.BaseType
    ): string {
        const prefix =
            internalConstants.loadingServiceChatMessagePrefix + publication._id.toString()

        const publicationModerationText = generateTextFromPassedAnswers(
            {
                contentLanguage: publication.language,
                passedAnswers: publication.answers,
            },
            botContent
        )

        return `${prefix}\n\n${publicationModerationText}`
    }

    export function moderationSynchronizedText(
        publication: PublicationDocument,
        text: UniqueMessage,
        author: UserProfile.BaseType
    ): string {
        let PublicationText = ''
        for (let i = 0; i < publication.answers.length; i++) {
            const answer = publication.answers[i]
            const answerValue =
                Survey.Helper.getAnswerStringValue(answer, text) ??
                text.userPublications.finalOptionalAnswerIsNull
            PublicationText += `${i + 1}.\t${answer.question.publicTitle}: <b>${answerValue}</b>`
            PublicationText += '\n'
        }

        let prefix = `<b>id ${publication._id.toString()}</b>\n`
        prefix += `Автор: ID ${author.telegramId}`
        if (author.telegramInfo.username) prefix += ` @${author.telegramInfo.username}`

        let statusString = publicationStatusString(publication.status, text)
        statusString = `${statusString} #${publication.status}`
        const mainText = `${PublicationText}`
        prefix += '\n\n'
        prefix += statusString

        const tgLink = publicationTelegramLinks(publication)
        if (tgLink) prefix += `\n\n<a href="${tgLink}">Ссылка на пост</a>`

        const publicationTagsText = getPublicationTagsString(publication)

        return `${prefix}\n\n${mainText}\n${publicationTagsText}`
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
        let publicationText = ''

        for (const answer of publication.answers) {
            if (answer.question.addAnswerToTelegramPublication == false) continue
            if (Survey.Helper.isPassedAnswerMediaType(answer)) continue

            const answerStringValue = Survey.Helper.getAnswerStringValue(answer, text)
            publicationText += `${answer.question.publicTitle}: <b>${answerStringValue}</b>\n`
        }

        const publicationTagsText = getPublicationTagsString(publication)
        const statusString = publicationStatusString(publication.status, text)

        const prefix = `<b>${statusString}</b>\n`

        return `${prefix}\n${publicationText}\n${publicationTagsText}`
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

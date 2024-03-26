import moment from 'moment'
import { internalConstants } from 'src/app/app.internal-constants'
import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import {
    Survey,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'
import { UniqueMessage } from 'src/business-logic/bot-content/schemas/models/bot-content.unique-message'
import { PublicationStatus } from 'src/business-logic/publication-storage/enums/publication-status.enum'
import {
    Publication,
    PublicationDocument,
} from 'src/business-logic/publication-storage/schemas/publication.schema'

export namespace SurveyFormatter {
    export function generateTextFromPassedAnswers(
        answers: Survey.PassedAnswersCache,
        botContent: BotContent
    ) {
        const text = botContent.uniqueMessage
        let result = ''
        for (let i = 0; i < answers.passedAnswers.length; i++) {
            const answer = answers.passedAnswers[i]
            const answerStringValue =
                SurveyUsageHelpers.getAnswerStringValue(answer, text) ??
                text.surveyFinal.textOptionalAnswerIsNull
            result += `${i + 1}.\t${answer.question.publicTitle}: <b>${answerStringValue}</b>\n`
        }
        return result
    }

    export function moderationPreSynchronizedText(
        publication: PublicationDocument,
        botContent: BotContent
    ): string {
        const prefix =
            internalConstants.loadingServiceChatMessagePrefix + publication._id.toString()

        const advertModerationText = generateTextFromPassedAnswers(
            {
                contentLanguage: publication.language,
                passedAnswers: publication.answers,
            },
            botContent
        )

        return `${prefix}\n\n${advertModerationText}`
    }

    export function makeUserMessageWithAdvertInfo(
        originalText: string,
        advert: PublicationDocument,
        text: UniqueMessage
    ): string {
        const tgAdvertLink = advertPublicationTelegramLink(advert)
        if (tgAdvertLink) {
            originalText = originalText.replace(
                text.moderation.messagePostLinkPlaceholder,
                tgAdvertLink
            )
        }
        return originalText
            .replace(text.moderation.messageAdvertIdPlaceholder, advert._id.toString())
            .replace(
                text.moderation.messagePostDatePlaceholder,
                moment(advert.creationDate).utcOffset('Europe/Moscow').format('DD.MM.yyyy HH:mm')
            )
            .replace(
                text.moderation.messagePostStatusPlaceholder,
                advertStatusString(advert.status, text)
            )
    }

    function advertStatusString(status: PublicationStatus.Union, text?: UniqueMessage): string {
        if (text) {
            switch (status) {
                case 'moderation':
                    return text.moderation.publicationStatusModeration
                case 'rejected':
                    return text.moderation.publicationStatusRejected
                case 'active':
                    return text.moderation.publicationStatusActive
                case 'notRelevant':
                    return text.moderation.publicationStatusNotRelevant
            }
        } else {
            switch (status) {
                case 'moderation':
                    return '📝 Проверка'
                case 'rejected':
                    return '🚫 Отклонено'
                case 'active':
                    return '✅ Актуально'
                case 'notRelevant':
                    return '❌ Не актуально'
            }
        }
    }

    function advertPublicationTelegramLink(publication: Publication): string | null {
        if (publication.mainChannelPublicationId) {
            return `https://t.me/${internalConstants.advertsMainChannelName}/${publication.mainChannelPublicationId}`
        }
        return null
    }
}

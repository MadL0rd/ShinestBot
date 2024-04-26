import { Survey } from '.'
import { BotContent } from '../bot-content'

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
}

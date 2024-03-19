import { BotContent } from 'src/business-logic/bot-content/schemas/bot-content.schema'
import {
    Survey,
    SurveyUsageHelpers,
} from 'src/business-logic/bot-content/schemas/models/bot-content.survey'

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
}

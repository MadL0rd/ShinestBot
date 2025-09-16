import { Survey } from '.'
import { BotContent } from '../bot-content'

/**
 * Namespace for survey entity formatter functions.
 * This namespace should contain functions responsible for formatting entity data.
 */
export namespace _SurveyFormatter {
    type GenerateTextFromPassedAnswersArgs = {
        readonly answers: Survey.PassedAnswer[]
        readonly text: BotContent.UniqueMessage
        readonly filtrationMode: 'allAnswers' | 'publicAnswers' | 'publicAndSpecified' | 'forUser'
        readonly omitAnswerTypes?: Survey.AnswerTypeName[]
        readonly putIndexes: boolean
    }
    export function generateTextFromPassedAnswers(args: GenerateTextFromPassedAnswersArgs) {
        const text = args.text

        return args.answers
            .filter((answer) => {
                if (args.omitAnswerTypes?.includes(answer.type)) return false

                switch (args.filtrationMode) {
                    case 'allAnswers':
                        return true

                    case 'publicAnswers':
                        return answer.question.addAnswerToTelegramPublication

                    case 'publicAndSpecified':
                        return (
                            answer.question.addAnswerToTelegramPublication &&
                            Survey.Helper.getAnswerStringValue(answer, text)
                        )

                    case 'forUser':
                        if (answer.question.showInTheLastStep.isFalse) return false
                        return true
                }
            })
            .map((answer, index) => {
                let result = ''

                if (args.putIndexes) result += `${index + 1}.\t`

                result += answer.question.publicTitle + ': '

                const answerStringValue =
                    Survey.Helper.getAnswerStringValue(answer, text) ??
                    text.surveyFinal.textOptionalAnswerIsNull
                result += `<b>${answerStringValue}</b>`

                return result
            })
            .join('\n')
    }
}

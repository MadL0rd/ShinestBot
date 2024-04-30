import { Survey } from '.'
import { BotContent } from '../bot-content'

/**
 * Namespace for survey entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _SurveyHelper {
    // =====================
    // Cache helpers
    // =====================
    export const answerTypeNames = {
        options: 'Выбор варианта',
        numeric: 'Число',
        string: 'Строка',
        stringGptTips: 'Строка + GPT',
        image: 'Изображение',
        video: 'Видео',
        mediaGroup: 'Медиа группа',
        multipleChoice: 'Множественный выбор',
    }

    export const answerTypeNameAllCases = Object.keys(answerTypeNames) as Survey.AnswerTypeName[]

    const swapFn = <T extends Record<string, S>, S extends string>(obj: T) => {
        const res = {} as any // I'm not worried about impl safety
        Object.entries(obj).forEach(([key, value]) => {
            res[value] = key
        })
        return res as { [K in keyof T as T[K]]: K }
    }
    export const answerTypeNameByPublicName = swapFn(answerTypeNames)

    export function getAnswerTypePublicName(type: Survey.AnswerTypeName) {
        return answerTypeNames[type]
    }
    export function getAnswerTypeByPublicName(publicName: string) {
        return answerTypeNameByPublicName[publicName]
    }

    // =====================
    // Usage helpers
    // =====================

    export function isPassedAnswerMediaType(
        answer: Survey.PassedAnswer
    ): answer is Survey.PassedAnswerMedia {
        switch (answer.type) {
            case 'string':
            case 'stringGptTips':
            case 'options':
            case 'numeric':
            case 'multipleChoice':
                return false
            case 'image':
            case 'video':
            case 'mediaGroup':
                return true
        }
    }
    export function findNextQuestion(
        survey: Survey.BaseType,
        passedQuestionAnswers: Survey.PassedAnswer[]
    ): Survey.Question | null {
        const allQuestions = survey.questions.filter(function (question) {
            for (const filter of question.filters) {
                const targetAnswer = passedQuestionAnswers.find(
                    (answer) => answer.question.id == filter.targetQuestionId
                )
                if (!targetAnswer || targetAnswer.type != 'options') {
                    return false
                }

                const answerValue = targetAnswer.selectedOptionId
                if (!answerValue || filter.validOptionIds.includes(answerValue) == false) {
                    return false
                }
            }
            return true
        })
        for (const question of allQuestions) {
            if (!passedQuestionAnswers.some((element) => element.question.id == question.id)) {
                return question
            }
        }
        return null
    }

    export function getAnswerStringValue(
        answer: Survey.PassedAnswer,
        text: BotContent.UniqueMessage
    ): string | null {
        switch (answer.type) {
            case 'options':
                return (
                    answer.question.options.find((option) => option.id == answer.selectedOptionId)
                        ?.text ?? null
                )
            case 'multipleChoice':
                return answer.selectedOptionsIds.isEmpty
                    ? null
                    : answer.question.options
                          .filter((option) => answer.selectedOptionsIds.includes(option.id))
                          .map((option) => option.text)
                          .join(', ')

            case 'numeric':
                const unitLabel = answer.question.unit
                if (unitLabel && answer.selectedNumber) {
                    return `${answer.selectedNumber.toStringWithSpaces} ${unitLabel}`
                } else {
                    return answer.selectedNumber?.toStringWithSpaces ?? null
                }

            case 'string':
            case 'stringGptTips':
                return answer.selectedString

            case 'image':
            case 'video':
            case 'mediaGroup':
                return `${text.surveyFinal.textMediaPrefix} (${answer.media.length} ${text.surveyFinal.textMediaUnit})`
        }
    }

    export function isAnswerSpecified(answer: Survey.PassedAnswer): boolean {
        switch (answer.type) {
            case 'options':
                return typeof answer.selectedOptionId === 'string'

            case 'multipleChoice':
                return answer.selectedOptionsIds.isNotEmpty

            case 'numeric':
                return typeof answer.selectedNumber === 'number'

            case 'string':
            case 'stringGptTips':
                return typeof answer.selectedString === 'string'

            case 'image':
            case 'video':
            case 'mediaGroup':
                return answer.media.isNotEmpty
        }
    }

    export function isAnswerSpecifiedCorrectly(answer: Survey.PassedAnswer): boolean {
        // Is required but not specified
        if (answer.question.isRequired && Survey.Helper.isAnswerSpecified(answer).isFalse) {
            return false
        }
        // Legacy option selected
        if (
            answer.type === 'options' &&
            Survey.Helper.isAnswerSpecified(answer) &&
            !answer.question.options.some((option) => option.id === answer.selectedOptionId)
        ) {
            return false
        }

        return true
    }

    export function getEmptyAnswerForQuestion(question: Survey.Question): Survey.PassedAnswer {
        switch (question.type) {
            case 'string':
                return {
                    type: 'string',
                    question: question,
                    selectedString: null,
                }
            case 'stringGptTips':
                return {
                    type: 'stringGptTips',
                    question: question,
                    selectedString: null,
                }
            case 'options':
                return {
                    type: 'options',
                    question: question,
                    selectedOptionId: null,
                }
            case 'multipleChoice':
                return {
                    type: 'multipleChoice',
                    question: question,
                    selectedOptionsIds: [],
                }
            case 'numeric':
                return {
                    type: 'numeric',
                    question: question,
                    selectedNumber: null,
                }
            case 'image':
                return {
                    type: 'image',
                    question: question,
                    media: [],
                }
            case 'video':
                return {
                    type: 'video',
                    question: question,
                    media: [],
                }
            case 'mediaGroup':
                return {
                    type: 'mediaGroup',
                    question: question,
                    media: [],
                }
        }
    }

    export function localizePassedAnswers(
        passedAnswers: Survey.PassedAnswer[],
        survey: Survey.BaseType
    ): Survey.PassedAnswer[] {
        return passedAnswers.compactMap((answer) => {
            const localizedQuesion = survey.questions.find(
                (question) => question.id == answer.question.id
            )
            if (!localizedQuesion) return null
            answer.question = localizedQuesion
            return answer
        })
    }
}

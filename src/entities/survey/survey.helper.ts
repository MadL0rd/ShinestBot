import z from 'zod'
import { Survey } from '.'
import { BotContent } from '../bot-content'

/**
 * Namespace for survey entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _SurveyHelper {
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
            case 'optionsInline':
            case 'numeric':
            case 'multipleChoice':
            case 'phoneNumber':
                return false
            case 'image':
            case 'singleImage':
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
            for (const filter of question.filters.filter((filter) => filter.type === 'showIf')) {
                const targetAnswer = passedQuestionAnswers.find(
                    (answer) => answer.question.id === filter.targetQuestionId
                )
                if (!targetAnswer) return false

                switch (targetAnswer.type) {
                    case 'options':
                    case 'optionsInline':
                        break
                    case 'string':
                    case 'multipleChoice':
                    case 'numeric':
                    case 'stringGptTips':
                    case 'image':
                    case 'singleImage':
                    case 'video':
                    case 'mediaGroup':
                    case 'phoneNumber':
                        return false
                }

                const answerValue = targetAnswer.selectedOptionId
                if (!answerValue || filter.validOptionIds.includes(answerValue) === false) {
                    return false
                }
            }
            return true
        })
        for (const question of allQuestions) {
            if (!passedQuestionAnswers.some((element) => element.question.id === question.id)) {
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
            case 'optionsInline':
                return (
                    answer.question.options.find((option) => option.id === answer.selectedOptionId)
                        ?.text ?? null
                )
            case 'multipleChoice':
                return answer.selectedOptionsIds.isEmpty
                    ? null
                    : answer.question.options
                          .filter((option) => answer.selectedOptionsIds.includes(option.id))
                          .map((option) => option.text)
                          .join(', ')

            case 'numeric': {
                const unitLabel = answer.question.unit
                if (unitLabel && answer.selectedNumber) {
                    return `${answer.selectedNumber.toStringWithSpaces} ${unitLabel}`
                } else {
                    return answer.selectedNumber?.toStringWithSpaces ?? null
                }
            }

            case 'string':
            case 'stringGptTips':
            case 'phoneNumber':
                return answer.selectedString

            case 'singleImage':
                return answer.media.isEmpty
                    ? text.surveyFinal.textMediaAnswerForSkippedQuestion
                    : `${text.surveyFinal.textMediaPrefix} (1 ${text.surveyFinal.textMediaUnit})`

            case 'image':
            case 'video':
            case 'mediaGroup':
                return answer.media.isEmpty
                    ? text.surveyFinal.textMediaAnswerForSkippedQuestion
                    : `${text.surveyFinal.textMediaPrefix} (${answer.media.length} ${text.surveyFinal.textMediaUnit})`
        }
    }

    export function extractAnswerValue(answer: Survey.PassedAnswer) {
        switch (answer.type) {
            case 'options':
            case 'optionsInline':
                if (answer.selectedOptionId) {
                    if (answer.question.boolConvertibleAnswers) {
                        return answer.selectedOptionId.toLowerCase().startsWith('yes')
                    } else if (
                        // Conversion for legacy cached questions
                        answer.question.boolConvertibleAnswers === undefined &&
                        answer.question.options.length === 2 &&
                        answer.question.options.some((option) => option.id.startsWith('yes')) &&
                        answer.question.options.some((option) => option.id.startsWith('no'))
                    ) {
                        return answer.selectedOptionId.toLowerCase().startsWith('yes')
                    }
                }

                return answer.selectedOptionId

            case 'multipleChoice':
                return answer.selectedOptionsIds

            case 'numeric':
                return answer.selectedNumber

            case 'string':
            case 'stringGptTips':
            case 'phoneNumber':
                return answer.selectedString

            case 'singleImage':
                return answer.media[0] ?? null

            case 'image':
            case 'video':
            case 'mediaGroup':
                return answer.media
        }
    }

    export function transformAnswerToDataObject(answers: Survey.PassedAnswer[]) {
        return answers.reduce(
            (acc, answer) => {
                acc[answer.question.id] = extractAnswerValue(answer)
                return acc
            },
            {} as Record<string, unknown>
        )
    }

    export function isAnswerSpecified(answer: Survey.PassedAnswer): boolean {
        switch (answer.type) {
            case 'options':
            case 'optionsInline':
                return typeof answer.selectedOptionId === 'string'

            case 'multipleChoice':
                return answer.selectedOptionsIds.isNotEmpty

            case 'numeric':
                return typeof answer.selectedNumber === 'number'

            case 'string':
            case 'stringGptTips':
            case 'phoneNumber':
                return typeof answer.selectedString === 'string'

            case 'singleImage':
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
            case 'optionsInline':
                return {
                    type: 'optionsInline',
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
            case 'singleImage':
                return {
                    type: 'singleImage',
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
            case 'phoneNumber':
                return {
                    type: 'phoneNumber',
                    question: question,
                    selectedString: null,
                }
        }
    }

    export function localizePassedAnswers(
        passedAnswers: Survey.PassedAnswer[],
        survey: Survey.BaseType
    ): Survey.PassedAnswer[] {
        return passedAnswers.compactMap((answer) => {
            const localizedQuestion = survey.questions.find(
                (question) => question.id === answer.question.id
            )
            if (!localizedQuestion) return null
            answer.question = localizedQuestion
            return answer
        })
    }

    type PassedAnswerWithOptionsOrSomeOther =
        | Pick<
              Exclude<Survey.PassedAnswer, { type: 'options' | 'optionsInline' }>,
              'type' | 'question'
          >
        | Survey.PassedAnswerWithOptionsDefault
        | Survey.PassedAnswerWithOptionsInline

    export function extractPassedAnswerSelectedOptionId(args: {
        passedAnswers: PassedAnswerWithOptionsOrSomeOther[]
        targetQuestionId: string
    }): string | null {
        const { passedAnswers, targetQuestionId } = args
        const targetAnswer = passedAnswers.find(
            (answer): answer is Survey.PassedAnswerWithOneSelectedOption =>
                answer.question.id === targetQuestionId &&
                (answer.type === 'optionsInline' || answer.type === 'options')
        )

        return targetAnswer?.selectedOptionId ?? null
    }

    export function extractPassedAnswerSelectedOptionIdWithValidation<
        OptionIdSchema extends z.Schema,
    >(args: {
        passedAnswers: PassedAnswerWithOptionsOrSomeOther[]
        targetQuestionId: string
        schema: OptionIdSchema
    }): z.output<OptionIdSchema> | null {
        const { passedAnswers, targetQuestionId, schema } = args
        const targetAnswer = passedAnswers.find(
            (answer): answer is Survey.PassedAnswerWithOneSelectedOption =>
                answer.question.id === targetQuestionId &&
                (answer.type === 'optionsInline' || answer.type === 'options')
        )
        if (!targetAnswer) return null

        return schema.safeParse(targetAnswer.selectedOptionId).data ?? null
    }
}

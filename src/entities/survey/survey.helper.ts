import { BotContent } from '../bot-content'
import { _SurveyEntity as SurveyEntity } from './survey.entity'

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
    }

    export const answerTypeNameAllCases = Object.keys(
        answerTypeNames
    ) as SurveyEntity.AnswerTypeName[]

    const swapFn = <T extends Record<string, S>, S extends string>(obj: T) => {
        const res = {} as any // I'm not worried about impl safety
        Object.entries(obj).forEach(([key, value]) => {
            res[value] = key
        })
        return res as { [K in keyof T as T[K]]: K }
    }
    export const answerTypeNameByPublicName = swapFn(answerTypeNames)

    export function getAnswerTypePublicName(type: SurveyEntity.AnswerTypeName) {
        return answerTypeNames[type]
    }
    export function getAnswerTypeByPublicName(publicName: string) {
        return answerTypeNameByPublicName[publicName]
    }

    // =====================
    // Usage helpers
    // =====================

    export function isPassedAnswerMediaType(
        answer: SurveyEntity.PassedAnswer
    ): answer is SurveyEntity.PassedAnswerMedia {
        switch (answer.type) {
            case 'string':
            case 'stringGptTips':
            case 'options':
            case 'numeric':
                return false
            case 'image':
            case 'video':
            case 'mediaGroup':
                return true
        }
    }
    export function findNextQuestion(
        survey: SurveyEntity.BaseType,
        passedQuestionAnswers: SurveyEntity.PassedAnswer[]
    ): SurveyEntity.Question | null {
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
        answer: SurveyEntity.PassedAnswer,
        text: BotContent.UniqueMessage
    ): string | undefined {
        switch (answer.type) {
            case 'options':
                return answer.question.options.find(
                    (option) => option.id == answer.selectedOptionId
                )?.text
            case 'numeric':
                const unitLabel = answer.question.unit
                if (unitLabel && answer.selectedNumber) {
                    return `${answer.selectedNumber.toStringWithSpaces} ${unitLabel}`
                } else {
                    return answer.selectedNumber?.toStringWithSpaces
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

    export function getEmptyAnswerForQuestion(
        question: SurveyEntity.Question
    ): SurveyEntity.PassedAnswer {
        switch (question.type) {
            case 'string':
                return {
                    type: 'string',
                    question: question,
                    selectedString: undefined,
                }
            case 'stringGptTips':
                return {
                    type: 'stringGptTips',
                    question: question,
                    selectedString: undefined,
                }
            case 'options':
                return {
                    type: 'options',
                    question: question,
                    selectedOptionId: undefined,
                }
            case 'numeric':
                return {
                    type: 'numeric',
                    question: question,
                    selectedNumber: undefined,
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
}

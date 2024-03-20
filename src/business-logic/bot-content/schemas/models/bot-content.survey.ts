import { UniqueMessage } from './bot-content.unique-message'

export namespace Survey {
    // =====================
    // Models for db
    // =====================
    export type Model = {
        readonly contentLanguage: string
        readonly questions: Question[]
    }

    export type PassedAnswersCache = {
        readonly contentLanguage: string
        passedAnswers: PassedAnswer[]
    }

    // =====================
    // Question Types
    // =====================
    type QuestionCommonFields = {
        readonly id: string
        readonly isRequired: boolean
        readonly questionText: string
        readonly publicTitle: string
        readonly filters: Filter[]
        readonly addAnswerToTelegramPublication: boolean
    }
    export type Filter = {
        readonly targetQuestionId: string
        readonly validOptionIds: string[]
    }

    export type QuestionWithOptions = QuestionCommonFields & AnswerTypeWithOptions
    export type QuestionNumeric = QuestionCommonFields & AnswerTypeNumeric
    export type QuestionString = QuestionCommonFields & AnswerTypeString
    export type QuestionImage = QuestionCommonFields & AnswerTypeImage
    export type QuestionVideo = QuestionCommonFields & AnswerTypeVideo
    export type QuestionMediaGroup = QuestionCommonFields & AnswerTypeMediaGroup

    export type Question =
        | QuestionWithOptions
        | QuestionNumeric
        | QuestionString
        | QuestionImage
        | QuestionVideo
        | QuestionMediaGroup

    export type QuestionMedia = QuestionImage | QuestionVideo | QuestionMediaGroup

    // =====================
    // Answer Types
    // =====================
    export type AnswerTypeWithOptions = {
        readonly type: 'options'
        readonly options: AnswerOption[]
        readonly useIdAsPublicationTag: boolean
    }
    export type AnswerOption = {
        readonly id: string
        readonly text: string
    }

    type AnswerTypeNumeric = {
        readonly type: 'numeric'
        readonly unit?: string
    }

    type AnswerTypeString = {
        readonly type: 'string'
    }

    type AnswerTypeImage = {
        readonly type: 'image'
        readonly mediaMaxCount: number
    }

    type AnswerTypeVideo = {
        readonly type: 'video'
        readonly mediaMaxCount: number
    }

    type AnswerTypeMediaGroup = {
        readonly type: 'mediaGroup'
        readonly mediaMaxCount: number
    }

    export type AnswerType =
        | AnswerTypeWithOptions
        | AnswerTypeNumeric
        | AnswerTypeString
        | AnswerTypeImage
        | AnswerTypeVideo
        | AnswerTypeMediaGroup

    export type AnswerTypeName = Survey.AnswerType['type']

    // =====================
    // Passed Answers
    // =====================
    export type PassedAnswerWithOptions = {
        readonly type: 'options'
        question: QuestionWithOptions
        selectedOptionId?: string
    }

    export type PassedAnswerNumeric = {
        readonly type: 'numeric'
        question: QuestionNumeric
        selectedNumber?: number
    }

    export type PassedAnswerString = {
        readonly type: 'string'
        question: QuestionString
        selectedString?: string
    }

    export type PassedAnswerImage = {
        readonly type: 'image'
        question: QuestionImage
        media: TelegramFileData[]
    }

    export type PassedAnswerVideo = {
        readonly type: 'video'
        question: QuestionVideo
        media: TelegramFileData[]
    }

    export type PassedAnswerMediaGroup = {
        readonly type: 'mediaGroup'
        question: QuestionMediaGroup
        media: TelegramFileData[]
    }

    export type TelegramFileData = {
        readonly telegramFileId: string
        readonly telegramUrl?: string
        readonly cloudUrl?: string
        readonly fileType: 'photo' | 'video'
    }

    export type PassedAnswer =
        | PassedAnswerWithOptions
        | PassedAnswerNumeric
        | PassedAnswerString
        | PassedAnswerImage
        | PassedAnswerVideo
        | PassedAnswerMediaGroup

    export type PassedAnswerMedia = PassedAnswerImage | PassedAnswerVideo | PassedAnswerMediaGroup
}

export namespace SurveyCacheHelpers {
    export const answerTypeNames = {
        options: 'Выбор варианта',
        numeric: 'Число',
        string: 'Строка',
        image: 'Изображение',
        video: 'Видео',
        mediaGroup: 'Медиа группа',
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
}

export namespace SurveyUsageHelpers {
    export function findNextQuestion(
        survey: Survey.Model,
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
        text: UniqueMessage
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
                return answer.selectedString

            case 'image':
            case 'video':
            case 'mediaGroup':
                return `${text.surveyFinal.textMediaPrefix} (${answer.media.length} ${text.surveyFinal.textMediaUnit})`
        }
    }

    export function getEmptyAnswerForQuestion(question: Survey.Question): Survey.PassedAnswer {
        switch (question.type) {
            case 'string':
                return {
                    type: 'string',
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

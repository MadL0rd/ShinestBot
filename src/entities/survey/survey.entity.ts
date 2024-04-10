import { _surveyFormatter } from './survey.formatter'
import { _surveyHelper } from './survey.helper'

/**
 * Namespace for survey entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _SurveyEntity {
    export import Helper = _surveyHelper
    export import Formatter = _surveyFormatter

    export type BaseType = {
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

    export type AnswerTypeMedia = AnswerTypeImage | AnswerTypeVideo | AnswerTypeMediaGroup
    export type AnswerType =
        | AnswerTypeWithOptions
        | AnswerTypeNumeric
        | AnswerTypeString
        | AnswerTypeMedia

    export type AnswerTypeName = AnswerType['type']

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

import { MediaContent } from '../common/media-content.entity'
import { _SurveyFormatter } from './survey.formatter'
import { _SurveyHelper } from './survey.helper'

/**
 * Namespace for survey entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _SurveyEntity {
    export import Helper = _SurveyHelper
    export import Formatter = _SurveyFormatter

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
        readonly showInTheLastStep: boolean
        readonly questionText: string
        readonly media: MediaContent
        readonly publicTitle: string
        readonly filters: Filter[]
        readonly addAnswerToTelegramPublication: boolean
        readonly serviceMessageNavigationText: string
    }

    /**
     * @param type filter type.
     * "pre" for pre-filtration while preparing survey for user.
     * "post" for post-filtration -- deleting user's answer if target option was found in target question
     */
    export type Filter = {
        readonly type: 'showIf' | 'removeIf'
        readonly targetQuestionId: string
        readonly validOptionIds: string[]
    }

    export type QuestionWithOptions = QuestionCommonFields & AnswerTypeWithOptions
    export type QuestionAnswerOptionInline = QuestionCommonFields & AnswerTypeWithOptionsInline
    export type QuestionWithMultipleChoice = QuestionCommonFields & AnswerTypeWithMultipleChoice
    export type QuestionNumeric = QuestionCommonFields & AnswerTypeNumeric
    export type QuestionString = QuestionCommonFields & AnswerTypeString
    export type QuestionStringGptTips = QuestionCommonFields & AnswerTypeStringGptTips
    export type QuestionImage = QuestionCommonFields & AnswerTypeImage
    export type QuestionSingleImage = QuestionCommonFields & AnswerTypeSingleImage
    export type QuestionVideo = QuestionCommonFields & AnswerTypeVideo
    export type QuestionMediaGroup = QuestionCommonFields & AnswerTypeMediaGroup
    export type QuestionTelephoneNumber = QuestionCommonFields & AnswerTypeTelephoneNumber

    export type Question =
        | QuestionWithOptions
        | QuestionAnswerOptionInline
        | QuestionWithMultipleChoice
        | QuestionNumeric
        | QuestionString
        | QuestionStringGptTips
        | QuestionImage
        | QuestionSingleImage
        | QuestionVideo
        | QuestionMediaGroup
        | QuestionTelephoneNumber

    export type QuestionMedia =
        | QuestionImage
        | QuestionSingleImage
        | QuestionVideo
        | QuestionMediaGroup

    // =====================
    // Answer Types
    // =====================
    export type AnswerTypeWithOptions = {
        readonly type: 'options'
        readonly options: AnswerOption[]
        readonly useIdAsPublicationTag: boolean
        readonly boolConvertibleAnswers: boolean
    }

    export type AnswerTypeWithOptionsInline = {
        readonly type: 'optionsInline'
        readonly options: AnswerOption[]
        readonly useIdAsPublicationTag: boolean
        readonly boolConvertibleAnswers: boolean
    }

    export type AnswerTypeWithMultipleChoice = {
        readonly type: 'multipleChoice'
        readonly options: AnswerOption[]
        readonly minCount: number
        readonly maxCount: number
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

    type AnswerTypeStringGptTips = {
        readonly type: 'stringGptTips'
    }

    type AnswerTypeImage = {
        readonly type: 'image'
        readonly maxCount: number
    }

    type AnswerTypeSingleImage = {
        readonly type: 'singleImage'
        readonly maxCount: 1
        readonly serviceMessageFilledText?: string
    }

    type AnswerTypeVideo = {
        readonly type: 'video'
        readonly maxCount: number
    }

    type AnswerTypeMediaGroup = {
        readonly type: 'mediaGroup'
        readonly maxCount: number
    }

    type AnswerTypeTelephoneNumber = {
        readonly type: 'phoneNumber'
    }

    export type AnswerTypeMedia =
        | AnswerTypeImage
        | AnswerTypeSingleImage
        | AnswerTypeVideo
        | AnswerTypeMediaGroup
    export type AnswerType =
        | AnswerTypeWithOptions
        | AnswerTypeWithOptionsInline
        | AnswerTypeWithMultipleChoice
        | AnswerTypeNumeric
        | AnswerTypeString
        | AnswerTypeStringGptTips
        | AnswerTypeMedia
        | AnswerTypeTelephoneNumber

    export type AnswerTypeName = AnswerType['type']

    // =====================
    // Passed Answers
    // =====================

    export type PassedAnswerWithOptionsDefault = {
        readonly type: 'options'
        question: QuestionWithOptions
        selectedOptionId: string | null
    }

    export type PassedAnswerWithOptionsInline = {
        readonly type: 'optionsInline'
        question: QuestionAnswerOptionInline
        selectedOptionId: string | null
    }

    export type PassedAnswerWithMultipleChoice = {
        readonly type: 'multipleChoice'
        question: QuestionWithMultipleChoice
        selectedOptionsIds: string[]
    }

    export type PassedAnswerNumeric = {
        readonly type: 'numeric'
        question: QuestionNumeric
        selectedNumber: number | null
    }

    export type PassedAnswerString = {
        readonly type: 'string'
        question: QuestionString
        selectedString: string | null
    }

    export type PassedAnswerStringGptTips = {
        readonly type: 'stringGptTips'
        question: QuestionStringGptTips
        selectedString: string | null
    }

    export type PassedAnswerImage = {
        readonly type: 'image'
        question: QuestionImage
        media: TelegramFileData[]
    }

    export type PassedAnswerSingleImage = {
        readonly type: 'singleImage'
        question: QuestionSingleImage
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

    export type PassedAnswerTelephoneNumber = {
        readonly type: 'phoneNumber'
        question: QuestionTelephoneNumber
        selectedString: string | null
    }

    export type TelegramFileData = {
        readonly telegramFileId: string
        readonly telegramFileUniqueId: string
        readonly telegramUrl?: string
        readonly cloudUrl?: string
        readonly fileType: 'photo' | 'video'
        readonly receiveTimestamp?: Date
    }

    export type PassedAnswer =
        | PassedAnswerWithOptionsDefault
        | PassedAnswerWithOptionsInline
        | PassedAnswerWithMultipleChoice
        | PassedAnswerNumeric
        | PassedAnswerString
        | PassedAnswerStringGptTips
        | PassedAnswerImage
        | PassedAnswerSingleImage
        | PassedAnswerVideo
        | PassedAnswerMediaGroup
        | PassedAnswerTelephoneNumber

    export type PassedAnswerMedia =
        | PassedAnswerImage
        | PassedAnswerSingleImage
        | PassedAnswerVideo
        | PassedAnswerMediaGroup

    export type PassedAnswerWithOneSelectedOption =
        | PassedAnswerWithOptionsDefault
        | PassedAnswerWithOptionsInline
}

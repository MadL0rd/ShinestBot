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
    type QuestionAbstract<SomeAnswerType extends AnswerType> = {
        readonly id: string
        readonly required: boolean
        readonly questionText: string
        readonly publicTitle: string
        readonly answerType: SomeAnswerType
        readonly filters: Filter[]
        readonly addAnswerToTelegramPublication: boolean
    }
    export type Filter = {
        readonly targetQuestionId: string
        readonly validOptionIds: string[]
    }

    type QuestionWithOptions = QuestionAbstract<AnswerTypeWithOptions>
    type QuestionNumeric = QuestionAbstract<AnswerTypeNumeric>
    type QuestionString = QuestionAbstract<AnswerTypeString>
    type QuestionImage = QuestionAbstract<AnswerTypeImage>
    type QuestionVideo = QuestionAbstract<AnswerTypeVideo>
    type QuestionMediaGroup = QuestionAbstract<AnswerTypeMediaGroup>

    export type Question =
        | QuestionWithOptions
        | QuestionNumeric
        | QuestionString
        | QuestionImage
        | QuestionVideo
        | QuestionMediaGroup

    // =====================
    // Answer Types
    // =====================
    export type AnswerTypeWithOptions = {
        readonly name: 'withOptions'
        readonly options: AnswerOption[]
        readonly useIdAsPublicationTag: boolean
    }
    export type AnswerOption = {
        readonly id: string
        readonly text: string
    }

    type AnswerTypeNumeric = {
        readonly name: 'numeric'
        readonly unit?: string
    }

    type AnswerTypeString = {
        readonly name: 'string'
    }

    type AnswerTypeImage = {
        readonly name: 'image'
        readonly mediaMaxCount: number
    }

    type AnswerTypeVideo = {
        readonly name: 'video'
        readonly mediaMaxCount: number
    }

    type AnswerTypeMediaGroup = {
        readonly name: 'mediaGroup'
        readonly mediaMaxCount: number
    }

    export type AnswerType =
        | AnswerTypeWithOptions
        | AnswerTypeNumeric
        | AnswerTypeString
        | AnswerTypeImage
        | AnswerTypeVideo
        | AnswerTypeMediaGroup

    export type AnswerTypeName = Survey.AnswerType['name']

    // =====================
    // Passed Answers
    // =====================
    type PassedAnswerWithOptions = {
        question: QuestionWithOptions
        selectedOption?: string
    }

    type PassedAnswerNumeric = {
        question: QuestionNumeric
        selectedNumber: number
    }

    type PassedAnswerString = {
        question: QuestionString
        selectedString: string
    }

    type PassedAnswerImage = {
        question: QuestionImage
        media: TelegramFileData[]
    }

    type PassedAnswerVideo = {
        question: QuestionVideo
        media: TelegramFileData[]
    }

    type PassedAnswerMediaGroup = {
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
}

export namespace SurveyCacheHelpers {
    export const answerTypeNames = {
        withOptions: 'Выбор варианта',
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

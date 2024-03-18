export namespace Survey {
    export interface Model {
        questions: Question[]
    }

    export class Question {
        readonly id: string
        readonly required: boolean
        readonly questionText: string
        readonly publicTitle: string
        readonly answerType: AnswerType
        readonly filters: Filter[]
        readonly addAnswerToTelegramPublication: boolean
    }

    type AnswerWithOptions = {
        name: 'answerOptions'
        options: AnswerOption[]
        useIdAsPublicationTag: boolean
    }
    export type AnswerOption = {
        id: string
        text: string
    }
    type AnswerNumeric = {
        name: 'numeric'
        unit?: string
    }
    type AnswerString = {
        name: 'string'
    }
    type AnswerImage = {
        name: 'image'
        mediaMaxCount: number
    }
    type AnswerVideo = {
        name: 'video'
        mediaMaxCount: number
    }
    type AnswerMediaGroup = {
        name: 'mediaGroup'
        mediaMaxCount: number
    }

    export type AnswerType =
        | AnswerWithOptions
        | AnswerNumeric
        | AnswerString
        | AnswerImage
        | AnswerVideo
        | AnswerMediaGroup

    export interface Filter {
        targetQuestionId: string
        validOptionIds: string[]
    }
}

export namespace SurveyCacheHelpers {
    export type AnswerTypeName = Survey.AnswerType['name']

    export const answerTypeNames = {
        answerOptions: 'Выбор варианта',
        numeric: 'Число',
        string: 'Строка',
        image: 'Изображение',
        video: 'Видео',
        mediaGroup: 'Медиа группа',
    }

    export const answerTypeNameAllCases = Object.keys(answerTypeNames) as AnswerTypeName[]

    const swapFn = <T extends Record<string, S>, S extends string>(obj: T) => {
        const res = {} as any // I'm not worried about impl safety
        Object.entries(obj).forEach(([key, value]) => {
            res[value] = key
        })
        return res as { [K in keyof T as T[K]]: K }
    }
    export const answerTypeNameByPublicName = swapFn(answerTypeNames)

    export function getAnswerTypePublicName(type: AnswerTypeName) {
        return answerTypeNames[type]
    }
    export function getAnswerTypeByPublicName(publicName: string) {
        return answerTypeNameByPublicName[publicName]
    }
}

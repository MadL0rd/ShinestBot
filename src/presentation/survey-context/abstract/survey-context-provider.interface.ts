import { Survey } from 'src/entities/survey'
import { UserProfile } from 'src/entities/user-profile'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'

export namespace SurveyContextProviderType {
    export const allCases = ['default', 'moderationEditing'] as const
    export type Union = (typeof allCases)[number]

    export function getId(sceneName: Union): number {
        return allCases.indexOf(sceneName) + 1
    }

    export function getById(id: number): Union | null {
        return allCases[id - 1] ?? null
    }
}

type ValidationResultSuccess = {
    canStartSurvey: true
}

type ValidationResultDenied = {
    canStartSurvey: false
    nextScene?: SceneEntrance.SomeSceneDto
    message?: string
}

export type ValidationResult = ValidationResultSuccess | ValidationResultDenied

export type ISurveyContextProvider = ISurveyContextProviderTyped &
    ISurveyContextProviderPublicMethods

export interface ISurveyContextProviderTyped {
    /**
     * Provider identifier
     */
    type: SurveyContextProviderType.Union
}

export interface ISurveyContextProviderPublicMethods {
    /**
     * Check the conditions of the start-up survey, if necessary
     */
    validateUserCanStartSurvey(user: UserProfile.BaseType): Promise<ValidationResult>

    /**
     * Get survey data source
     */
    getSurvey(user: UserProfile.BaseType): Promise<Survey.BaseType>

    /**
     * Get user passed answers
     */
    getAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache>

    /**
     * __! Use with caution !__
     *
     * Returns the __question-ordered__ portion of the answers
     * __up to the first missing__ question
     *
     * __Overwrites__ the survey __cache__ for the user if the survey has been completed.
     *
     * Worth using if you think the survey is complete and you need to clean up all the legacy data
     */
    prepareConsistentAnswersCache(user: UserProfile.BaseType): Promise<Survey.PassedAnswersCache>

    /**
     * Store user answers to cache
     */
    setAnswersCache(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void>

    /**
     * Use to edit old survey user answers
     */
    setAnswersCacheWithLegacyQuestionsValidation(
        user: UserProfile.BaseType,
        cache: Survey.PassedAnswersCache | undefined
    ): Promise<void>

    /**
     * Makes cache empty or undefined
     */
    clearAnswersCache(user: UserProfile.BaseType): Promise<void>

    /**
     * Append answer to cache
     */
    pushAnswerToCache(user: UserProfile.BaseType, answer: Survey.PassedAnswer): Promise<void>

    /**
     * Allow to remove answer
     *
     * @param beforeQuestionWithId
     *  - `undefined` will remove last element of answers array
     *  - `id` try to find previous question and remove answer from cache
     */
    popAnswerFromCache(
        user: UserProfile.BaseType,
        beforeQuestionWithId?: string
    ): Promise<Survey.PassedAnswer | undefined>

    /**
     * Determines actions after the user completes the survey
     */
    completeSurveyAndGetNextScene(
        user: UserProfile.BaseType
    ): Promise<SceneEntrance.SomeSceneDto | undefined>
}

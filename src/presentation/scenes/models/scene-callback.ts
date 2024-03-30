import { SceneName } from './scene-name.enum'

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 *
 * Try to keep values as concise as possible
 */
export enum SceneCallbackAction {
    segueButton = 0,
    surveySkipQuestion = 1,
    surveyBackToPreviousQuestion = 2,
    publicationSetStatusNotRelevant = 3,
}

export interface SceneCallbackDataSegue {
    segueSceneName: string
}

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 */
export class SceneCallbackData {
    constructor(
        // sceneName id
        private readonly s: number,
        // action
        private readonly a: SceneCallbackAction,
        // data
        private readonly d: object
    ) {}

    public get sceneName(): SceneName.Union | null {
        return SceneName.getById(this.s)
    }
    public get action(): SceneCallbackAction {
        return this.a
    }
    public get data(): object {
        return this.d
    }

    toString(): string {
        return JSON.stringify(this)
    }

    toPrettyString(): string {
        return JSON.stringify({
            sceneName: this.sceneName,
            action: SceneCallbackAction[this.action],
            data: this.data,
        })
    }
}

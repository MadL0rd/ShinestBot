/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 *
 * Try to keep values as concise as possible
 */
export enum SceneCallbackAction {
    segueButton = 0,
}

export interface SceneCallbackDataSegue {
    segueSceneName: string
}

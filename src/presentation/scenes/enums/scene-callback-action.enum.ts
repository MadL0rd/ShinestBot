/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 *
 * Try to keep values as concise as possible
 */
export enum SceneCallbackAction {
    userAdvertReuse = 0,
    userAdvertSetStatusNotRelevant = 1,
    segueButton = 2,
    salesAssistanceSendAudio = 3,
    salesAssistanceSendVideo = 4,
    salesAssistanceSendDocs = 5,

    advertSearchFilterFromOwnerOnlyTrue = 6,
    advertSearchFilterFromOwnerOnlyFalse = 7,
    advertSearchFilterWithСommissionOnlyTrue = 8,
    advertSearchFilterWithСommissionOnlyFalse = 9,
    advertSearchFilterLocality = 10,
    advertSearchFilterEstateType = 11,
    advertSearchFilterPrice = 12,
}

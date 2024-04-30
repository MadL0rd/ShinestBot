export const eventsSchema = {
    start: {
        type: 'start',
        localizedTitle: 'Запустил бота',
        startParam: null as string | null,
    },
    botIsBlockedDetected: {
        type: 'botIsBlockedDetected',
        localizedTitle: 'Бот был заблокирован пользователем',
    },
    sendMessage: {
        type: 'sendMessage',
        localizedTitle: 'Отправил сообщение',
        text: '' as string | undefined,
    },
    callbackButtonDidTapped: {
        type: 'callbackButtonDidTapped',
        localizedTitle: 'Нажал на кнопку в сообщении',
        data: undefined as string | undefined,
    },

    surveyQuestionStartAnswering: {
        type: 'surveyQuestionStartAnswering',
        localizedTitle: 'Начал отвечать на вопрос',
        questionId: '' as string,
    },

    failedToSendMessage: {
        type: 'failedToSendMessage',
        localizedTitle: 'Не удалось отправить сообщение пользователю',
    },

    startSceneOnboarding: {
        type: 'startSceneOnboarding',
        localizedTitle: 'Начал смотреть онбординг',
    },
    startSceneMainMenu: {
        type: 'startSceneMainMenu',
        localizedTitle: 'Перешел в главное меню',
    },
    startSceneAdminMenu: {
        type: 'startSceneAdminMenu',
        localizedTitle: 'Перешел к сцене AdminMenu',
    },
    startSceneAdminMenuGenerateMetrics: {
        type: 'startSceneAdminMenuGenerateMetrics',
        localizedTitle: 'Перешел к сцене adminMenuGenerateMetrics',
    },
    startSceneAdminMenuUsersManagementScene: {
        type: 'startSceneAdminMenuUsersManagementScene',
        localizedTitle: 'Перешел к сцене AdminMenuUsersManagementScene',
    },
    startSceneAdminMenuMailingScene: {
        type: 'startSceneAdminMenuMailingScene',
        localizedTitle: 'Перешел к сцене AdminMenuMailingScene',
    },
    startSceneLanguageSettingsScene: {
        type: 'startSceneLanguageSettingsScene',
        localizedTitle: 'Перешел к сцене LanguageSettingsScene',
    },
    startSceneSurvey: {
        type: 'startSceneSurvey',
        localizedTitle: 'Перешел к сцене Survey',
        surveyType: '' as string | undefined,
    },
    startSceneSurveyContinue: {
        type: 'startSceneSurveyContinue',
        localizedTitle: 'Перешел к сцене SurveyContinue',
    },
    startSceneSurveyFinal: {
        type: 'startSceneSurveyFinal',
        localizedTitle: 'Перешел к сцене SurveyFinal',
    },
    startSceneSurveyQuestionOptions: {
        type: 'startSceneSurveyQuestionOptions',
        localizedTitle: 'Перешел к сцене SurveyQuestionOptions',
    },
    startSceneSurveyQuestionStringNumeric: {
        type: 'startSceneSurveyQuestionStringNumeric',
        localizedTitle: 'Перешел к сцене surveyQuestionStringNumeric',
    },
    startSceneSurveyQuestionMedia: {
        type: 'startSceneSurveyQuestionMedia',
        localizedTitle: 'Перешел к сцене SurveyQuestionMedia',
    },
    startSceneUserPublications: {
        type: 'startSceneUserPublications',
        localizedTitle: 'Перешел к сцене userPublications',
    },
    startSceneModerationEditing: {
        type: 'startSceneModerationEditing',
        localizedTitle: 'Перешел к сцене moderationEditing',
    },
    startSceneSurveyDescription: {
        type: 'startSceneSurveyDescription',
        localizedTitle: 'Перешел к сцене surveyDescription',
    },
    startSceneSurveyQuestionStringGptTips: {
        type: 'startSceneSurveyQuestionStringGptTips',
        localizedTitle: 'Перешел к сцене surveyQuestionStringGptTips',
    },
    startSceneSurveyQuestionStringGptTipsAnswerEditing: {
        type: 'startSceneSurveyQuestionStringGptTipsAnswerEditing',
        localizedTitle: 'Перешел к сцене surveyQuestionStringGptTipsAnswerEditing',
    },
    startSceneSurveyQuestionStringGptTipsUpdateWithGpt: {
        type: 'startSceneSurveyQuestionStringGptTipsUpdateWithGpt',
        localizedTitle: 'Перешел к сцене surveyQuestionStringGptTipsUpdateWithGpt',
    },
    startSceneSurveyQuestionMultipleChoice: {
        type: 'startSceneSurveyQuestionMultipleChoice',
        localizedTitle: 'Перешел к сцене surveyQuestionMultipleChoice',
    },
    /** New scene event placeholder */
} as const

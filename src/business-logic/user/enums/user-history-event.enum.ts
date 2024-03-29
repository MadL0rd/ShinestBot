export enum UserHistoryEvent {
    start = 'Старт',
    botIsBlockedDetected = 'Бот был заблокирован пользователем',
    startWithParam = 'Запустил бота по ссылке c параметром',
    sendMessage = 'Отправил сообщение',
    callbackButtonDidTapped = 'Нажал на кнопку в сообщении',

    failedToSendMessage = 'Не удалось отправить сообщение пользователю',

    startSceneOnboarding = 'Начал смотреть онбординг',
    startSceneMainMenu = 'Перешел в главное меню',
    startSceneAdminMenu = 'Перешел к сцене AdminMenu',
    startSceneAdminMenuGenerateMetrics = 'Перешел к сцене adminMenuGenerateMetrics',
    startSceneAdminMenuUsersManagementScene = 'Перешел к сцене AdminMenuUsersManagementScene',
    startSceneAdminMenuMailingScene = 'Перешел к сцене AdminMenuMailingScene',
    startSceneLanguageSettingsScene = 'Перешел к сцене LanguageSettingsScene',
    /** New scene event placeholder */
}

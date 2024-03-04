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
    startSceneAdminMenuGenerateMetrix = 'Перешел к сцене adminMenuGenerateMetrix',
    startSceneAdminMenuUsersManagementScene = 'Перешел к сцене AdminMenuUsersManagementScene',
    startSceneAdminMenuMailingScene = 'Перешел к сцене AdminMenuMailingScene',
    /** New scene event placeholder */
}

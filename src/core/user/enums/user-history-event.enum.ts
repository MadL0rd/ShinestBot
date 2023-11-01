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
    startSceneAdminMenuGenerateMetrix = 'Перешел к сцене AdminMenuGenerateMetrix',
    startSceneAdminMenuMailing = 'Перешел к сцене AdminMenuMailing',
    startSceneAdminMenuUsersManagement = 'Перешел к сцене AdminMenuUsersManagement',
    /** New scene event placeholder */
}

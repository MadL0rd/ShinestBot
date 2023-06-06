export enum UserHistoryEvent {
    start = 'Старт',
    startWithParam = 'Запустил бота по ссылке c параметром',
    sendMessage = 'Отправил сообщение',
    callbackButtonDidTapped = 'Нажал на кнопку в сообщении',

    startSceneOnboarding = 'Начал смотреть онбординг',
    startSceneMainMenu = 'Перешел в главное меню',
	/** New scene event placeholder */
}

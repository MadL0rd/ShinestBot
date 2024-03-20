// ==================
// * Generated file *
// ==================

export class UniqueMessage {
    readonly common = new Common()
    readonly mainMenu = new MainMenu()
    readonly adminMenu = new AdminMenu()
    readonly adminMenuMetrics = new AdminMenuMetrics()
    readonly payment = new Payment()
    readonly notification = new Notification()
    readonly surveyContinue = new SurveyContinue()
    readonly survey = new Survey()
    readonly surveyFinal = new SurveyFinal()
}

export class Common {
    readonly unknownState = 'Я тебя не понимаю 😔\n⬇️ Нажми на кнопку снизу ⬇️'
    readonly permissionDenied = 'У вас нет доступа к этому разделу'
    readonly callbackActionFaild = 'Не удалось совершить выбраное дейстие'
    readonly buttonReturnToMainMenu = '⬅️ В главное меню'
    readonly buttonBackToPreviousMenu = '⬅️ Вернуться в предыдущее меню'
    readonly bannedUserMessage = 'Похоже, что вам больше нельзя пользоваться этим ботом'
    readonly comingSoon = 'Эта функция скоро появится'
    readonly selectLanguageText = 'Выберите язык'
    readonly errorMessage = 'Кажется, что-то пошло не по плану 🙄'
}

export class MainMenu {
    readonly text = 'Ты оказался в главном меню 😊'
    readonly textRepoLink = 'https://github.com/MadL0rd/ShinestBot'
    readonly buttonAdminMenu = '🔐 Меню администратора'
    readonly buttonRepoLink = '📂 Репозиторий'
    readonly buttonLanguageSettings = '🌎 Выбрать другой язык'
    readonly buttonSurvey = '📝 Пройти опрос'
}

export class AdminMenu {
    readonly text = 'Вы в меню администратора'
    readonly buttonReloadData = '📥 Стянуть новые тексты из гугл таблицы'
    readonly buttonDownloadTables = '📊 Выгрузить данные об использовании бота'
    readonly buttonUsersManagement = '📋 Управление правами доступа пользователей'
    readonly buttonMailing = '📨 Рассылка'
    readonly returnBack = '⬅️ Вернуться в меню администратора'
    readonly mailingText = 'Введите сообщение\nПеред рассылкой сообщение будет продублировано для проверки'
    readonly mailingTextChekMessage = 'Вы собираетесь отправить пользователям следующее сообщение:'
    readonly mailingButtonSend = 'Начать отправку'
    readonly mailingButtonCancel = 'Отмена'
    readonly usersManagementTextFindUser = 'Для поиска пользователя введите его id либо usermane в формате @username'
    readonly usersManagementPermissionsInfo = 'Информация о модификаторах доступа:\n*owner* - Вдаделец бота: может назначать администраторов + имеет все права администратора)\n*admin* - Администратор: доступен вход в меню администратора, назначение ролей кроме owner и admin\n*banned* - Заблокированый пользователь (админ и владелец не могут быть заблокированы, если необходимо заблокировать администратора, то сначала нужно забрать у него админский уровень доступа)'
    readonly usersManagementButtonEditPermissions = 'Управлять правами доступа'
    readonly usersManagementButtonNewSearch = 'Новый поиск'
}

export class AdminMenuMetrics {
    readonly selectDateText = 'Выберите период'
    readonly selectDateMonth = 'Месяц'
    readonly selectDateQuarter = 'Квартал'
    readonly selectDateYear = 'Год'
}

export class Payment {
    readonly text = 'Что хотите приобрести?'
}

export class Notification {
    /** Будет использоваться в случае, если chatGPT по какой-либо причине не ответил на наш запрос */
    readonly morningTextDefault = 'Доброе утро!'
    /** Промт для GPT */
    readonly morningTextGptPromt = 'Напишите текст утреннего уведомления для человека неизвестного пола.'
    /** Будет использоваться в случае, если chatGPT по какой-либо причине не ответил на наш запрос */
    readonly eveningTextDefault = 'Добрый вечер!'
    /** Промт для GPT */
    readonly eveningTextGptPromt = 'Напишите текст вечернего уведомления для человека неизвестного пола.'
    readonly buttonFairytale = 'Написать терапевтическую сказку'
    readonly buttonMainMenu = 'Перейти в главное меню'
    readonly subscriptionText = 'Дорогой друг, некоторые твои подписки скоро истекают:'
    readonly buttonSubscriptionText = 'Оплатить'
    /** За сколько дней до окончания подписки на пакет начнут приходить уведомления */
    readonly quantityDaysBeforeSubscriptionNotification = '7'
    /** Список из времён доступных пользователю для установки утренних уведомлений */
    readonly morningTimeList = '07:00\n07:30\n08:00\n08:30\n09:00\n09:30\n10:00\n10:30\n11:00'
    /** Время утреннего уведомления по умолчанию */
    readonly morningTimeDefault = '08:00'
    /** Список из времён доступных пользователю для установки вечерних уведомлений */
    readonly eveningTimeList = '18:00\n18:30\n19:00\n19:30\n20:00\n20:30\n21:00\n21:30\n22:00'
    /** Время вечернего уведомления по умолчанию */
    readonly eveningTimeDefault = '22:15'
    /** Время для уведомлений о скором окончании подписки */
    readonly subscriptionTime = '20:04'
    /** Кнопка, по нажатию на которую в настройках можно отказаться от получения уведомлений данного типа */
    readonly buttonDontSend = 'Не отправлять'
}

export class SurveyContinue {
    readonly text = 'Продолжить заполнение заявки или начать заново?'
    readonly buttonBegining = 'Начать заново'
    readonly buttonResume = 'Продолжить'
}

export class Survey {
    readonly buttonOptionalQuestionSkip = '👀 Пропустить'
    readonly buttonBackToPreviousQuestion = '⬅️ Вернуться к предыдущему вопросу'
    readonly texMessageAditionaltInlineMenu = 'Также вы можете'
    readonly buttonAditionaltInlineMenuSkip = '👀 Пропустить'
    readonly buttonAditionaltInlineMenuBackToPrevious = '⬆️ Вернуться'
    readonly textAditionaltInlineMenuSkipEventLog = '👀 Вопрос пропущен'
    readonly textAditionaltInlineMenuBackToPreviousEventLog = '⬆️ Возврат к предыдущему вопросу'
    /** Сообщение, которое будет выведено пользователю, если он ввёл текст в ответ на вопрос, где надо дать число */
    readonly errorMessageAnswerIsNotNumber = 'Введите число\nЕсли вам нужно указать дробное значение, то отделите его точкой или запятой\n\n<i>Пример: 123.4</i>'
}

export class SurveyFinal {
    readonly textMediaPrefix = 'Медиа'
    readonly textMediaUnit = 'шт.'
    readonly textOptionalAnswerIsNull = '<i>Не указано</i>'
    readonly text = '👆🏻 Выше все данные из вашей заявки.\nВы можете отправить её в текущем виде либо отредактировать.\n\nЧтобы отредактировать какой-то пункт, отправьте мне его номер.\n\n<i>P.S.: Вы можете вернуться в главное меню и отредактировать заявку позже, просто при возвращении нажмите кнопку *Опрос*, а затем *Продолжить*</i>'
    readonly buttonDone = 'Отправить'
}

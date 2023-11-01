// ==================
// * Generated file *
// ==================

export class UniqueMessage {
    readonly common = new Common()
    readonly mainMenu = new MainMenu()
    readonly adminMenu = new AdminMenu()
    readonly adminMenuMetrics = new AdminMenuMetrics()
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
}

export class MainMenu {
    readonly text = 'Ты оказался в главном меню 😊'
    readonly textRepoLink = 'https://github.com/MadL0rd/ShinestBot'
    readonly buttonAdminMenu = '🔐 Меню администратора'
    readonly buttonRepoLink = '📂 Репозиторий'
    readonly buttonLanguageSettings = '🌎 Выбрать другой язык'
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

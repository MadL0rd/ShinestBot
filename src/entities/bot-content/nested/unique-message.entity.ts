// ==================
// * Generated file *
// ==================

export class UniqueMessagePrimitive {
    readonly common = new Common()
    readonly mainMenu = new MainMenu()
    readonly adminMenu = new AdminMenu()
    readonly adminMenuMetrics = new AdminMenuMetrics()
    readonly payment = new Payment()
    readonly notification = new Notification()
    readonly surveyContinue = new SurveyContinue()
    readonly surveyDescription = new SurveyDescription()
    readonly survey = new Survey()
    readonly surveyQuestionMedia = new SurveyQuestionMedia()
    readonly surveyQuestionMultipleChoice = new SurveyQuestionMultipleChoice()
    readonly surveyFinal = new SurveyFinal()
    readonly surveyQuestionGptTip = new SurveyQuestionGptTip()
    readonly moderationCommand = new ModerationCommand()
    readonly moderation = new Moderation()
    readonly userPublications = new UserPublications()
    readonly moderationEditing = new ModerationEditing()
}
export class UniqueMessageWithParams {
    readonly common: Common
    readonly mainMenu: MainMenu
    readonly adminMenu: AdminMenu
    readonly adminMenuMetrics: AdminMenuMetrics
    readonly payment: Payment
    readonly notification: Notification
    readonly surveyContinue: SurveyContinue
    readonly surveyDescription: SurveyDescription
    readonly survey: Survey
    readonly surveyQuestionMedia: SurveyQuestionMedia
    readonly surveyQuestionMultipleChoice: SurveyQuestionMultipleChoiceWithParams
    readonly surveyFinal: SurveyFinal
    readonly surveyQuestionGptTip: SurveyQuestionGptTip
    readonly moderationCommand: ModerationCommand
    readonly moderation: Moderation
    readonly userPublications: UserPublications
    readonly moderationEditing: ModerationEditing

    constructor(private readonly base: UniqueMessagePrimitive) {
        this.common = base.common
        this.mainMenu = base.mainMenu
        this.adminMenu = base.adminMenu
        this.adminMenuMetrics = base.adminMenuMetrics
        this.payment = base.payment
        this.notification = base.notification
        this.surveyContinue = base.surveyContinue
        this.surveyDescription = base.surveyDescription
        this.survey = base.survey
        this.surveyQuestionMedia = base.surveyQuestionMedia
        this.surveyQuestionMultipleChoice = new SurveyQuestionMultipleChoiceWithParams(
            base.surveyQuestionMultipleChoice
        )
        this.surveyFinal = base.surveyFinal
        this.surveyQuestionGptTip = base.surveyQuestionGptTip
        this.moderationCommand = base.moderationCommand
        this.moderation = base.moderation
        this.userPublications = base.userPublications
        this.moderationEditing = base.moderationEditing
    }
}

export class Common {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=8:8)
     */
    readonly unknownState = 'Я тебя не понимаю 😔\n⬇️ Нажми на кнопку снизу ⬇️'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=9:9)
     */
    readonly permissionDenied = 'У вас нет доступа к этому разделу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=10:10)
     */
    readonly callbackActionFaild = 'Не удалось совершить выбраное дейстие'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=11:11)
     */
    readonly buttonReturnToMainMenu = '⬅️ В главное меню'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=12:12)
     */
    readonly buttonBackToPreviousMenu = '⬅️ Вернуться в предыдущее меню'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=13:13)
     */
    readonly bannedUserMessage = 'Похоже, что вам больше нельзя пользоваться этим ботом'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=14:14)
     */
    readonly comingSoon = 'Эта функция скоро появится'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=15:15)
     */
    readonly selectLanguageText = 'Выберите язык'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=16:16)
     */
    readonly errorMessage = 'Кажется, что-то пошло не по плану 🙄'
}

export class MainMenu {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=19:19)
     */
    readonly text = 'Ты оказался в главном меню 😊'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=20:20)
     */
    readonly textAbout = 'https://github.com/MadL0rd/ShinestBot'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=21:21)
     */
    readonly buttonAbout = '📂 Репозиторий'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=22:22)
     */
    readonly buttonAdminMenu = '🔐 Меню администратора'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=23:23)
     */
    readonly buttonLanguageSettings = '🌎 Выбрать другой язык'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=24:24)
     */
    readonly buttonSurvey = '📝 Пройти опрос'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=25:25)
     */
    readonly userPublications = '📰 Управление публикациями'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=26:26)
     */
    readonly editPublicationAsAdmin = '📰 Редактирование заявки'
}

export class AdminMenu {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=29:29)
     */
    readonly text = 'Вы в меню администратора'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=30:30)
     */
    readonly buttonReloadData = '📥 Стянуть новые тексты из гугл таблицы'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=31:31)
     */
    readonly buttonDownloadTables = '📊 Выгрузить данные об использовании бота'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=32:32)
     */
    readonly buttonUsersManagement = '📋 Управление правами доступа пользователей'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=33:33)
     */
    readonly buttonMailing = '📨 Рассылка'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=34:34)
     */
    readonly returnBack = '⬅️ Вернуться в меню администратора'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=35:35)
     */
    readonly mailingText =
        'Введите сообщение\nПеред рассылкой сообщение будет продублировано для проверки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=36:36)
     */
    readonly mailingTextChekMessage = 'Вы собираетесь отправить пользователям следующее сообщение:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=37:37)
     */
    readonly mailingButtonSend = 'Начать отправку'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=38:38)
     */
    readonly mailingButtonCancel = 'Отмена'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=39:39)
     */
    readonly usersManagementTextFindUser =
        'Для поиска пользователя введите его id либо usermane в формате @username'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=40:40)
     */
    readonly usersManagementPermissionsInfo =
        'Информация о модификаторах доступа:\n<b>owner</b> - Вдаделец бота: может назначать администраторов + имеет все права администратора)\n<b>admin</b> - Администратор: доступен вход в меню администратора, назначение ролей кроме owner и admin\n<b>banned</b> - Заблокированый пользователь (админ и владелец не могут быть заблокированы, если необходимо заблокировать администратора, то сначала нужно забрать у него админский уровень доступа)'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=41:41)
     */
    readonly usersManagementButtonEditPermissions = 'Управлять правами доступа'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=42:42)
     */
    readonly usersManagementButtonNewSearch = 'Новый поиск'
}

export class AdminMenuMetrics {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=45:45)
     */
    readonly selectDateText = 'Выберите период'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=46:46)
     */
    readonly selectDateMonth = 'Месяц'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=47:47)
     */
    readonly selectDateQuarter = 'Квартал'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=48:48)
     */
    readonly selectDateYear = 'Год'
}

export class Payment {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=51:51)
     */
    readonly text = 'Что хотите приобрести?'
}

export class Notification {
    /**
     * @description Будет использоваться в случае, если chatGPT по какой-либо причине не ответил на наш запрос
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=54:54)
     */
    readonly morningTextDefault = 'Доброе утро!'
    /**
     * @description Промт для GPT
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=55:55)
     */
    readonly morningTextGptPromt =
        'Напишите текст утреннего уведомления для человека неизвестного пола.'
    /**
     * @description Будет использоваться в случае, если chatGPT по какой-либо причине не ответил на наш запрос
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=56:56)
     */
    readonly eveningTextDefault = 'Добрый вечер!'
    /**
     * @description Промт для GPT
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=57:57)
     */
    readonly eveningTextGptPromt =
        'Напишите текст вечернего уведомления для человека неизвестного пола.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=58:58)
     */
    readonly buttonFairytale = 'Написать терапевтическую сказку'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=59:59)
     */
    readonly buttonMainMenu = 'Перейти в главное меню'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=60:60)
     */
    readonly subscriptionText = 'Дорогой друг, некоторые твои подписки скоро истекают:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=61:61)
     */
    readonly buttonSubscriptionText = 'Оплатить'
    /**
     * @description За сколько дней до окончания подписки на пакет начнут приходить уведомления
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=62:62)
     */
    readonly quantityDaysBeforeSubscriptionNotification = '7'
    /**
     * @description Список из времён доступных пользователю для установки утренних уведомлений
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=63:63)
     */
    readonly morningTimeList = '07:00\n07:30\n08:00\n08:30\n09:00\n09:30\n10:00\n10:30\n11:00'
    /**
     * @description Время утреннего уведомления по умолчанию
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=64:64)
     */
    readonly morningTimeDefault = '08:00'
    /**
     * @description Список из времён доступных пользователю для установки вечерних уведомлений
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=65:65)
     */
    readonly eveningTimeList = '18:00\n18:30\n19:00\n19:30\n20:00\n20:30\n21:00\n21:30\n22:00'
    /**
     * @description Время вечернего уведомления по умолчанию
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=66:66)
     */
    readonly eveningTimeDefault = '22:15'
    /**
     * @description Время для уведомлений о скором окончании подписки
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=67:67)
     */
    readonly subscriptionTime = '20:04'
    /**
     * @description Кнопка, по нажатию на которую в настройках можно отказаться от получения уведомлений данного типа
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=68:68)
     */
    readonly buttonDontSend = 'Не отправлять'
}

export class SurveyContinue {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=71:71)
     */
    readonly text = 'Продолжить заполнение заявки или начать заново?'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=72:72)
     */
    readonly buttonBegining = 'Начать заново'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=73:73)
     */
    readonly buttonResume = 'Продолжить'
}

export class SurveyDescription {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=75:75)
     */
    readonly text =
        'Вам нужно ответить на несколько вопросов, чтобы бот помог вам заполнить страницу памяти на сайте MemoryCode.ru\n\nВы можете в любой момент вернуться в главное меню при помощи команды /back_to_menu и позже продолжить заполнение страницы без потери прогресса\n\nЕсли вы ранее уже заполняли эту анкету, на следующем шаге вам будет предложено продолжить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=76:76)
     */
    readonly buttonStart = 'Приступить'
}

export class Survey {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=78:78)
     */
    readonly buttonOptionalQuestionSkip = '👀 Пропустить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=79:79)
     */
    readonly buttonBackToPreviousQuestion = '⬅️ Вернуться к предыдущему вопросу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=80:80)
     */
    readonly texMessageAditionaltInlineMenu = '🧭 Навигация'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=81:81)
     */
    readonly buttonAditionaltInlineMenuSkip = '👀 Пропустить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=82:82)
     */
    readonly buttonAditionaltInlineMenuBackToPrevious = '⬆️ Вернуться'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=83:83)
     */
    readonly textAditionaltInlineMenuSkipEventLog = '<i>👀 Вопрос пропущен</i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=84:84)
     */
    readonly textAditionaltInlineMenuBackToPreviousEventLog =
        '<i>⬆️ Возврат к предыдущему вопросу</i>'
    /**
     * @description Сообщение, которое будет выведено пользователю, если он ввёл текст в ответ на вопрос, где надо дать число
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=85:85)
     */
    readonly errorMessageAnswerIsNotNumber =
        'Введите число\nЕсли вам нужно указать дробное значение, то отделите его точкой или запятой\n\n<i>Пример: 123.4</i>'
}

export class SurveyQuestionMedia {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=87:87)
     */
    readonly buttonDone = '✅ Готово'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=88:88)
     */
    readonly buttonEdit = '🔄 Редактировать'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=89:89)
     */
    readonly buttonEditModeExit = 'Отмена'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=90:90)
     */
    readonly textFilesCountPrefix = 'Загружено файлов:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=91:91)
     */
    readonly textEditMode = 'Выберите файл, который хотите удалить'
}

export class SurveyQuestionMultipleChoice {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=93:93)
     */
    readonly textSelectionFalse = '⬜'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=94:94)
     */
    readonly textSelectionTrue = '✅'
    /**
     * @description Текст, который будет добавлен к вопросу типа multipleChoice.
     * minCount - минимальное количество пунктов, которые надо выбрать
     * maxCount - максимальное количество пунктов, которые можно выбрать
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=95:95)
     */
    readonly textDescription = 'Вы можете выбрать от minCount до maxCount пунктов'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=96:96)
     */
    readonly textSelectionPrefix = 'Вы выбрали:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=97:97)
     */
    readonly textMaxCountReached = 'Вы выбрали максимальное число вариантов'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=98:98)
     */
    readonly textMinCountdoesNotReached =
        'Вам нужно выбрать еще несколько вариантов чтобы продолжить'
}
export class SurveyQuestionMultipleChoiceWithParams {
    constructor(private readonly base: SurveyQuestionMultipleChoice) {}
    /**
     * @value: ⬜
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=93:93)
     */
    get textSelectionFalse(): string {
        return this.base.textSelectionFalse
    }
    /**
     * @value: ✅
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=94:94)
     */
    get textSelectionTrue(): string {
        return this.base.textSelectionTrue
    }
    /**
     * @value: Вы можете выбрать от minCount до maxCount пунктов
     * @description Текст, который будет добавлен к вопросу типа multipleChoice.
     * minCount - минимальное количество пунктов, которые надо выбрать
     * maxCount - максимальное количество пунктов, которые можно выбрать
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=95:95)
     */
    textDescription(args: { minCount: number; maxCount: number }): string {
        return this.base.textDescription
            .replaceAll('minCount', `${args.minCount}`)
            .replaceAll('maxCount', `${args.maxCount}`)
    }
    /**
     * @value: Вы выбрали:
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=96:96)
     */
    get textSelectionPrefix(): string {
        return this.base.textSelectionPrefix
    }
    /**
     * @value: Вы выбрали максимальное число вариантов
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=97:97)
     */
    get textMaxCountReached(): string {
        return this.base.textMaxCountReached
    }
    /**
     * @value: Вам нужно выбрать еще несколько вариантов чтобы продолжить
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=98:98)
     */
    get textMinCountdoesNotReached(): string {
        return this.base.textMinCountdoesNotReached
    }
}

export class SurveyFinal {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=100:100)
     */
    readonly textMediaPrefix = 'Медиа'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=101:101)
     */
    readonly textMediaUnit = 'шт.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=102:102)
     */
    readonly textOptionalAnswerIsNull = '<i>Не указано</i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=103:103)
     */
    readonly text =
        '👆🏻 Выше все данные из вашей заявки.\nВы можете отправить её в текущем виде либо отредактировать.\n\nЧтобы отредактировать какой-то пункт, отправьте мне его номер.\n\n<i>P.S.: Вы можете вернуться в главное меню и отредактировать заявку позже, просто при возвращении нажмите кнопку <b>Опрос</b>, а затем <b>Продолжить</b></i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=104:104)
     */
    readonly buttonDone = 'Отправить'
}

export class SurveyQuestionGptTip {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=106:106)
     */
    readonly textWaitingForGptAnswer = 'Формулирую ответ...'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=107:107)
     */
    readonly textStartMenu =
        'Бот может помочь Вам ответить на этот вопрос\nДля начала нужно кратко изложить основную мысль, если трудно сделать это сразу - бот задаст вам дополнительные вопросы'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=108:108)
     */
    readonly buttonStartMenuContinue = '😊 Отлично, приступаю!'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=109:109)
     */
    readonly buttonStartMenuGptTip = '🤔 Помоги собраться с мыслями'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=110:110)
     */
    readonly promptStartMenuGptTipTemperature = '0.4'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=111:111)
     */
    readonly promptStartMenuGptTip =
        'Я прохожу опрос для заполнения страницы посвященной памяти погибшего родственника.\nЯ уже увидел вопрос, но не смог сформулировать ответ самостоятельно, задай мне несколько наводящих вопросов чтобы помочь собраться с мыслями.\nЕсли информации достаточно, используй при формировании подсказок ответы на предыдущие вопросы.\n\nСООБЩЕНИЕ ОБЯЗАТЕЛЬНО ДОЛЖНО СОДЕРЖАТЬ КАК МИНИМУМ 3 ВОПРОСА ВОПРОСЫ ДОЛЖНЫ ПОДРАЗУМЕВАТЬ РАЗВЕРНУТЫЙ ОТВЕТ ОТВЕЧАЙ ОТ ЛИЦА БОТА, ПРИШЛИ ТОЛЬКО ИТОГОВОЕ СООБЩЕНИЕ.\nТебе НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ В СВОЁМ ОТВЕТЕ ФРАЗЫ:"ВОПРОСЫ ПОЛЬЗОВАТЕЛЮ", "ПРИМЕР СООБЩЕНИЯ"\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=112:112)
     */
    readonly textStartMenuEnterMessage =
        'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=113:113)
     */
    readonly textAnswerEditing = 'Отлично!\nВот что у вас получилось:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=114:114)
     */
    readonly buttonAnswerEditingDone = '👍 Мне нравится, можем идти дальше'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=115:115)
     */
    readonly buttonAnswerEditingUpdateWithGpt = '🧐 Попробуй улучшить мой ответ'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=116:116)
     */
    readonly buttonAnswerEditingRestart = '👀 Хочу ответить на вопрос заново'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=117:117)
     */
    readonly textUpdateWithGptWishes = 'Есть ли у Вас дополнительные пожелания'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=118:118)
     */
    readonly buttonUpdateWithGptWishesYes = '🤔 Да, сейчас расскажу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=119:119)
     */
    readonly buttonUpdateWithGptWishesNo = '👨‍🎨 Сделай на свой вкус'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=120:120)
     */
    readonly textUpdateWithGptWishesEnter =
        'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=121:121)
     */
    readonly promptUpdateWithGptTemperature = '0.4'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=122:122)
     */
    readonly promptUpdateWithGpt =
        'Я прохожу опрос для заполнения страницы посвященной памяти умершего родственника. \nНужно помочь мне развёрнуто ответить на вопрос.\nЕсли информации достаточно, используй ответы на предыдущие вопросы.\n\nВ ОТВЕТЕ НЕ ДОЛЖНО БЫТЬ НИЧЕГО ЛИШНЕГО, ТОЛЬКО ОТВЕТ НА ВОПРОС.\nОБЯЗАТЕЛЬНО УЧИТЫВАЙ МОИ ПОЖЕЛАНИЯ\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=123:123)
     */
    readonly textUpdateWithGptSaveResult = 'Как Вам результат?'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=124:124)
     */
    readonly buttonUpdateWithGptSaveResultYes = '👍 Мне нравится'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=125:125)
     */
    readonly buttonUpdateWithGptSaveResultTryAgain = '🧐 Попробуй ещё раз'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=126:126)
     */
    readonly buttonUpdateWithGptSaveResultNo = '😓 Прошлый вариант был лучше'
}

export class ModerationCommand {
    /**
     * @description Команда для чата модерации
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=129:129)
     */
    readonly approve = 'Принять'
    /**
     * @description Команда для чата модерации
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=130:130)
     */
    readonly place = 'Опубликовать'
    /**
     * @description Команда для чата модерации
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=131:131)
     */
    readonly reject = 'Отклонить'
    /**
     * @description Команда для чата модерации
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=132:132)
     */
    readonly notRelevant = 'Не актуально'
    /**
     * @description Команда для чата модерации
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=133:133)
     */
    readonly edit = 'Редактировать'
}

export class Moderation {
    /**
     * @description Описание команды Опубликовать
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=134:134)
     */
    readonly commandPlaceDescriptionText =
        'Команды "Принять", "Отклонить", "Не актуально" изменяют статус публикации\nКоманда <b>Опубликовать</b> позволяет выложить пост в канал\nКоманда "Редактировать" позволяет администратору поменять контент заявки'
    /**
     * @description Плейсхолдер
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=135:135)
     */
    readonly messageAdvertIdPlaceholder = 'advertIdPlaceholder'
    /**
     * @description Плейсхолдер
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=136:136)
     */
    readonly messagePostLinkPlaceholder = 'postLinkPlaceholder'
    /**
     * @description Плейсхолдер
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=137:137)
     */
    readonly messagePostStatusPlaceholder = 'advertStatusPlaceholder'
    /**
     * @description Плейсхолдер
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=138:138)
     */
    readonly messagePostDatePlaceholder = 'advertCreationDatePlaceholder'
    /**
     * @description Плейсхолдер
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=139:139)
     */
    readonly messagePostIdPlaceholder = 'postIdPlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=140:140)
     */
    readonly publicationStatusCreated = '🧾 Создана'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=141:141)
     */
    readonly publicationStatusModeration = '📝 Проверка'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=142:142)
     */
    readonly publicationStatusRejected = '🚫 Отклонено'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=143:143)
     */
    readonly publicationStatusActive = '✅ Актуально'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=144:144)
     */
    readonly publicationStatusNotRelevant = '❌ Не актуально'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=145:145)
     */
    readonly publicationTextLink = '<a href="postLinkPlaceholder">Ссылка на публикацию</a>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=146:146)
     */
    readonly messageText =
        '📩 <b>Сообщение от команды ShinestBot</b>\n\nID публикации: <b>advertIdPlaceholder</b>\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=147:147)
     */
    readonly messageTextModeration =
        'Ваше объявление было успешно отправлено на модерацию\n\nID: <b>advertIdPlaceholder</b>\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=148:148)
     */
    readonly messageTextAccepted =
        '🎉 <b>Поздравляем</b> 🎉\nВаше объявление было принято\n\nID: <b>advertIdPlaceholder</b>\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=149:149)
     */
    readonly messageTextRejected =
        '🚫 <b>Внимание</b> 🚫\nВаше объявление было Отклонено\n\nID: <b>advertIdPlaceholder</b>\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=150:150)
     */
    readonly messageTextNotRelevant =
        '⚠️ <b>Внимание</b> ⚠️\nВаше объявление было отмечено как неактуальное\n\nID: <b>advertIdPlaceholder</b>\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=151:151)
     */
    readonly moderationMessageTextNewSearchResult =
        '✅ <b>Внимание</b> ✅\nПоявилось новая публикация, подходящая под ваши фильтры'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=152:152)
     */
    readonly moderationMessagePublicationEdited = '✅ <b>Внимание</b> ✅\n\nЗаявка была обновлена'
}

export class UserPublications {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=155:155)
     */
    readonly text = 'Ваши объявления:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=156:156)
     */
    readonly textEmpty = 'Вы еще не подавали объявлений'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=157:157)
     */
    readonly textModeratorContact =
        'Напишите мне ваш вопрос, ответ модераторатора придёт вам вместе с уведомлением\n\nДля отмены текущего действия нажмите /cancel'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=158:158)
     */
    readonly advertInfoFormat =
        'ID: <b>advertIdPlaceholder</b>\nСтатус: advertStatusPlaceholder\nДата подачи заявки: advertCreationDatePlaceholder'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=159:159)
     */
    readonly advertInfoLinkFormat = '<a href="postLinkPlaceholder">Ссылка на публикацию</a>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=160:160)
     */
    readonly buttonSetStatusNotRelevant = '❌ Отметить как неактуальное'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=161:161)
     */
    readonly buttonReuseAdvert = '✏ Отредактировать и отправить повторно'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=162:162)
     */
    readonly writeToModerator = 'Написать модератору'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=163:163)
     */
    readonly buttonLinkWeb = '🌎 Посмотреть на сайте'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=164:164)
     */
    readonly buttonLinkTelegram = '➡️ Перейти к публикации'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=165:165)
     */
    readonly writeToModeratorError = 'Не удалось отправить ваше сообщение\nПопробуйте еще раз'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=166:166)
     */
    readonly writeToModeratorSuccess = 'Сообщение успешно отправлено'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=167:167)
     */
    readonly finalOptionalAnswerIsNull = '<i>Не указано</i>'
}

export class ModerationEditing {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=170:170)
     */
    readonly text = 'Приступить к редактированию заявки?\nid: <b>postIdPlaceholder</b>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=171:171)
     */
    readonly textEmpty = 'В данный момент вы не редактируете ни одну заявку'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1YLjE5g7Xa6GiV3F0q7Q6jFMZbFbOULrppV338E7_wiA/edit#gid=0&range=172:172)
     */
    readonly buttonStartEditing = 'Приступить'
}

// ==================
// * Generated file *
// ==================

export class UniqueMessagePrimitive {
    readonly common = new Common()
    readonly mainMenu = new MainMenu()
    readonly adminMenu = new AdminMenu()
    readonly adminMenuUsersManagement = new AdminMenuUsersManagement()
    readonly adminMenuMailing = new AdminMenuMailing()
    readonly adminMenuMailingCustom = new AdminMenuMailingCustom()
    readonly adminMenuMailingPreview = new AdminMenuMailingPreview()
    readonly adminMenuMetrics = new AdminMenuMetrics()
    readonly adminForum = new AdminForum()
    readonly surveyContinue = new SurveyContinue()
    readonly surveyDescription = new SurveyDescription()
    readonly survey = new Survey()
    readonly surveyQuestionMedia = new SurveyQuestionMedia()
    readonly surveyQuestionMultipleChoice = new SurveyQuestionMultipleChoice()
    readonly surveyFinal = new SurveyFinal()
    readonly surveyQuestionGptTip = new SurveyQuestionGptTip()
    readonly surveyQuestionPhoneNumber = new SurveyQuestionPhoneNumber()
    readonly training = new Training()
    readonly trainingStart = new TrainingStart()
}
export class UniqueMessageWithParams {
    readonly common: Common
    readonly mainMenu: MainMenu
    readonly adminMenu: AdminMenuWithParams
    readonly adminMenuUsersManagement: AdminMenuUsersManagementWithParams
    readonly adminMenuMailing: AdminMenuMailing
    readonly adminMenuMailingCustom: AdminMenuMailingCustom
    readonly adminMenuMailingPreview: AdminMenuMailingPreviewWithParams
    readonly adminMenuMetrics: AdminMenuMetrics
    readonly adminForum: AdminForumWithParams
    readonly surveyContinue: SurveyContinue
    readonly surveyDescription: SurveyDescription
    readonly survey: Survey
    readonly surveyQuestionMedia: SurveyQuestionMedia
    readonly surveyQuestionMultipleChoice: SurveyQuestionMultipleChoiceWithParams
    readonly surveyFinal: SurveyFinalWithParams
    readonly surveyQuestionGptTip: SurveyQuestionGptTip
    readonly surveyQuestionPhoneNumber: SurveyQuestionPhoneNumber
    readonly training: Training
    readonly trainingStart: TrainingStart

    constructor(private readonly base: UniqueMessagePrimitive) {
        this.common = base.common
        this.mainMenu = base.mainMenu
        this.adminMenu = new AdminMenuWithParams(base.adminMenu)
        this.adminMenuUsersManagement = new AdminMenuUsersManagementWithParams(
            base.adminMenuUsersManagement
        )
        this.adminMenuMailing = base.adminMenuMailing
        this.adminMenuMailingCustom = base.adminMenuMailingCustom
        this.adminMenuMailingPreview = new AdminMenuMailingPreviewWithParams(
            base.adminMenuMailingPreview
        )
        this.adminMenuMetrics = base.adminMenuMetrics
        this.adminForum = new AdminForumWithParams(base.adminForum)
        this.surveyContinue = base.surveyContinue
        this.surveyDescription = base.surveyDescription
        this.survey = base.survey
        this.surveyQuestionMedia = base.surveyQuestionMedia
        this.surveyQuestionMultipleChoice = new SurveyQuestionMultipleChoiceWithParams(
            base.surveyQuestionMultipleChoice
        )
        this.surveyFinal = new SurveyFinalWithParams(base.surveyFinal)
        this.surveyQuestionGptTip = base.surveyQuestionGptTip
        this.surveyQuestionPhoneNumber = base.surveyQuestionPhoneNumber
        this.training = base.training
        this.trainingStart = base.trainingStart
    }
}

export class Common {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=5:5)
     */
    readonly permissionDenied = 'У вас нет доступа к этому разделу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=6:6)
     */
    readonly buttonReturnToMainMenu = '⬅️ В главное меню'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=7:7)
     */
    readonly buttonBackToPreviousMenu = '⬅️ Вернуться в предыдущее меню'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=8:8)
     */
    readonly bannedUserMessage = 'Похоже, что вам больше нельзя пользоваться этим ботом'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=9:9)
     */
    readonly comingSoon = 'Эта функция скоро появится'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=10:10)
     */
    readonly textSelectLanguage = 'Выберите язык'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=11:11)
     */
    readonly errorMessage = 'Кажется, что-то пошло не по плану 🙄'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=12:12)
     */
    readonly technicalWorkMessage =
        'Функция недоступна в данный момент.\nПроводятся технические работы ⚙️'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=13:13)
     */
    readonly cancel = '❌ Отмена'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=14:14)
     */
    readonly continue = 'Продолжить'
}

export class MainMenu {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=17:17)
     */
    readonly text = 'Ты оказался в главном меню 😊'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=18:18)
     */
    readonly buttonAdminMenu = '🔐 Меню администратора'
}

export class AdminMenu {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=21:21)
     */
    readonly text = 'Вы в меню администратора\n\nVersion: <b>versionNumber</b>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=22:22)
     */
    readonly buttonReloadData = '📥 Стянуть новые тексты из гугл таблицы'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=23:23)
     */
    readonly buttonDownloadTables = '📊 Выгрузить данные'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=24:24)
     */
    readonly buttonUsersManagement = '⚙️ Управление пользователями'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=25:25)
     */
    readonly buttonMailing = '📨 Рассылка'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=26:26)
     */
    readonly buttonOther = '🛠️ Другое'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=27:27)
     */
    readonly textMenuOther =
        '🛠️ Другое\n\nОчередь на паузе: <b>chainTasksQueIsOnPause</b>\nЗадач в очереди: <b>chainTasksCountTotal</b>\nИз них зависших: <b>chainTasksCountIssued</b>\nЗависшие пользователи: <code>chainTasksIssuedUsers</code>\n\nVersion: <b>versionNumber</b>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=28:28)
     */
    readonly buttonResetIssuedUserTelegramIds = '♻️ Очистить список зависшх пользователей'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=29:29)
     */
    readonly buttonToggleExecutionQueuePause = '⏯️ Переключить паузу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=30:30)
     */
    readonly usersManagementTextFindUser =
        'Для поиска пользователя введите его id либо username в формате @username'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=31:31)
     */
    readonly returnBack = '⬅️ Вернуться в меню администратора'
}
export class AdminMenuWithParams {
    constructor(private readonly base: AdminMenu) {}
    /**
     * @value: Вы в меню администратора\n\nVersion: <b>versionNumber</b>
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=21:21)
     */
    text(args: { versionNumber: string }): string {
        return this.base.text.replaceAll('versionNumber', `${args.versionNumber}`)
    }
    /**
     * @value: 📥 Стянуть новые тексты из гугл таблицы
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=22:22)
     */
    get buttonReloadData(): string {
        return this.base.buttonReloadData
    }
    /**
     * @value: 📊 Выгрузить данные
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=23:23)
     */
    get buttonDownloadTables(): string {
        return this.base.buttonDownloadTables
    }
    /**
     * @value: ⚙️ Управление пользователями
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=24:24)
     */
    get buttonUsersManagement(): string {
        return this.base.buttonUsersManagement
    }
    /**
     * @value: 📨 Рассылка
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=25:25)
     */
    get buttonMailing(): string {
        return this.base.buttonMailing
    }
    /**
     * @value: 🛠️ Другое
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=26:26)
     */
    get buttonOther(): string {
        return this.base.buttonOther
    }
    /**
     * @value: 🛠️ Другое\n\nОчередь на паузе: <b>chainTasksQueIsOnPause</b>\nЗадач в очереди: <b>chainTasksCountTotal</b>\nИз них зависших: <b>chainTasksCountIssued</b>\nЗависшие пользователи: <code>chainTasksIssuedUsers</code>\n\nVersion: <b>versionNumber</b>
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=27:27)
     */
    textMenuOther(args: {
        chainTasksQueIsOnPause: string
        chainTasksCountTotal: number
        chainTasksCountIssued: number
        chainTasksIssuedUsers: string
        versionNumber: string
    }): string {
        return this.base.textMenuOther
            .replaceAll('chainTasksQueIsOnPause', `${args.chainTasksQueIsOnPause}`)
            .replaceAll('chainTasksCountTotal', `${args.chainTasksCountTotal}`)
            .replaceAll('chainTasksCountIssued', `${args.chainTasksCountIssued}`)
            .replaceAll('chainTasksIssuedUsers', `${args.chainTasksIssuedUsers}`)
            .replaceAll('versionNumber', `${args.versionNumber}`)
    }
    /**
     * @value: ♻️ Очистить список зависшх пользователей
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=28:28)
     */
    get buttonResetIssuedUserTelegramIds(): string {
        return this.base.buttonResetIssuedUserTelegramIds
    }
    /**
     * @value: ⏯️ Переключить паузу
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=29:29)
     */
    get buttonToggleExecutionQueuePause(): string {
        return this.base.buttonToggleExecutionQueuePause
    }
    /**
     * @value: Для поиска пользователя введите его id либо username в формате @username
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=30:30)
     */
    get usersManagementTextFindUser(): string {
        return this.base.usersManagementTextFindUser
    }
    /**
     * @value: ⬅️ Вернуться в меню администратора
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=31:31)
     */
    get returnBack(): string {
        return this.base.returnBack
    }
}

export class AdminMenuUsersManagement {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=34:34)
     */
    readonly textFindUser =
        'Для поиска пользователя введите его id либо username в формате @username'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=35:35)
     */
    readonly textCannotFindUser = 'Не удалось найти пользователя'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=36:36)
     */
    readonly buttonSelectMyAccount = 'Выбрать свой аккаунт'
    /**
     * @description https://core.telegram.org/bots/api#html-style
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=37:37)
     */
    readonly textSelectedUserInfo =
        'Имя: firstAndLastNames\nTelegram id: <code>telegramId</code>\nTelegram username: <b>telegramUsername</b>\nЗаменять стартовый параметр при запуске бота: enableStartParamRewriting\nОчередь остановлена: chainTasksQueueIsIssued\nКоличество задач в очереди: chainTasksCount\nПрава доступа: <b>activePermissions</b>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=38:38)
     */
    readonly buttonEditPermissions = 'Управлять правами доступа'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=39:39)
     */
    readonly buttonRestoreTopic = 'Пересоздать топик пользователю'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=40:40)
     */
    readonly buttonEnableStartParamRewriting = 'Тест ссылок и UTM'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=41:41)
     */
    readonly buttonNewSearch = 'Новый поиск'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=42:42)
     */
    readonly usersManagementPermissionsInfo =
        'Информация о модификаторах доступа:\n\n<b>owner</b> - Владелец бота: может назначать администраторов + имеет все права администратора)\n\n<b>admin</b> - Администратор: доступен вход в меню администратора, назначение ролей кроме owner и admin\n\n<b>banned</b> - Заблокированный пользователь (админ и владелец не могут быть заблокированы, если необходимо заблокировать администратора, то сначала нужно забрать у него уровень доступа admin)'
}
export class AdminMenuUsersManagementWithParams {
    constructor(private readonly base: AdminMenuUsersManagement) {}
    /**
     * @value: Для поиска пользователя введите его id либо username в формате @username
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=34:34)
     */
    get textFindUser(): string {
        return this.base.textFindUser
    }
    /**
     * @value: Не удалось найти пользователя
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=35:35)
     */
    get textCannotFindUser(): string {
        return this.base.textCannotFindUser
    }
    /**
     * @value: Выбрать свой аккаунт
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=36:36)
     */
    get buttonSelectMyAccount(): string {
        return this.base.buttonSelectMyAccount
    }
    /**
     * @value: Имя: firstAndLastNames\nTelegram id: <code>telegramId</code>\nTelegram username: <b>telegramUsername</b>\nЗаменять стартовый параметр при запуске бота: enableStartParamRewriting\nОчередь остановлена: chainTasksQueueIsIssued\nКоличество задач в очереди: chainTasksCount\nПрава доступа: <b>activePermissions</b>
     * @description https://core.telegram.org/bots/api#html-style
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=37:37)
     */
    textSelectedUserInfo(args: {
        firstAndLastNames: string
        telegramId: number
        telegramUsername: string
        activePermissions: string
        enableStartParamRewriting: string
        chainTasksQueueIsIssued: string
        chainTasksCount: number
    }): string {
        return this.base.textSelectedUserInfo
            .replaceAll('firstAndLastNames', `${args.firstAndLastNames}`)
            .replaceAll('telegramId', `${args.telegramId}`)
            .replaceAll('telegramUsername', `${args.telegramUsername}`)
            .replaceAll('activePermissions', `${args.activePermissions}`)
            .replaceAll('enableStartParamRewriting', `${args.enableStartParamRewriting}`)
            .replaceAll('chainTasksQueueIsIssued', `${args.chainTasksQueueIsIssued}`)
            .replaceAll('chainTasksCount', `${args.chainTasksCount}`)
    }
    /**
     * @value: Управлять правами доступа
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=38:38)
     */
    get buttonEditPermissions(): string {
        return this.base.buttonEditPermissions
    }
    /**
     * @value: Пересоздать топик пользователю
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=39:39)
     */
    get buttonRestoreTopic(): string {
        return this.base.buttonRestoreTopic
    }
    /**
     * @value: Тест ссылок и UTM
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=40:40)
     */
    get buttonEnableStartParamRewriting(): string {
        return this.base.buttonEnableStartParamRewriting
    }
    /**
     * @value: Новый поиск
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=41:41)
     */
    get buttonNewSearch(): string {
        return this.base.buttonNewSearch
    }
    /**
     * @value: Информация о модификаторах доступа:\n\n<b>owner</b> - Владелец бота: может назначать администраторов + имеет все права администратора)\n\n<b>admin</b> - Администратор: доступен вход в меню администратора, назначение ролей кроме owner и admin\n\n<b>banned</b> - Заблокированный пользователь (админ и владелец не могут быть заблокированы, если необходимо заблокировать администратора, то сначала нужно забрать у него уровень доступа admin)
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=42:42)
     */
    get usersManagementPermissionsInfo(): string {
        return this.base.usersManagementPermissionsInfo
    }
}

export class AdminMenuMailing {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=45:45)
     */
    readonly mailingText = 'Выберите режим рассылки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=46:46)
     */
    readonly buttonCustom = 'Ввод сообщения'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=47:47)
     */
    readonly buttonCopy = 'Скопировать пересланное сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=48:48)
     */
    readonly buttonForward = 'Переслать сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=49:49)
     */
    readonly buttonUsePreformed = 'Использовать заготовку'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=50:50)
     */
    readonly mailingTextCheckMessage = 'Вы собираетесь отправить пользователям следующее сообщение:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=51:51)
     */
    readonly mailingButtonSend = 'Начать отправку'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=52:52)
     */
    readonly buttonSendToAll = 'Все'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=53:53)
     */
    readonly buttonSendToPending = 'Ожидающие регистрации'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=54:54)
     */
    readonly buttonSendToAuthorized = 'Зарегистрированные/Авторизованные'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=55:55)
     */
    readonly buttonSendToUnregistered = 'Без регистрации'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=56:56)
     */
    readonly textAuthStatusChoice = 'Выберите статус адресатов данной рассылки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=57:57)
     */
    readonly textSendMessageToForward = 'Перешлите сообщение в этот диалог'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=58:58)
     */
    readonly textSelectMessage = 'Выберите одну из заготовок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=59:59)
     */
    readonly textEnterMessageText = 'Введите сообщение'
}

export class AdminMenuMailingCustom {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=62:62)
     */
    readonly textSetText =
        'Введите сообщение\n\nЕсли в тексте будет обнаружена редирект-ссылка, то к ней будет добавлен параметр telegramId с telegramId получателя'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=63:63)
     */
    readonly buttonSkipText = 'Без текста'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=64:64)
     */
    readonly textSetPhoto = 'Отправьте фото'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=65:65)
     */
    readonly buttonSkipPhoto = 'Без фото'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=66:66)
     */
    readonly textSetInlineButtonsLayout =
        'Отправьте количество будущих кнопок для каждой строки через пробел\n<i>Пример: \nЗапрос <code>2 1</code>\nДаст результат\n[Кнопка 1 строки][Кнопка 1 строки]\n[-------      Кнопка 2 строки      -------]\n</i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=67:67)
     */
    readonly textSelectInlineButtonToConfigure = 'Выберите кнопку для настройки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=68:68)
     */
    readonly textEnterButtonText = 'Введите текст кнопки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=69:69)
     */
    readonly textSetInlineButtons = 'Выберите кнопки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=70:70)
     */
    readonly buttonSkipInlineButtons = 'Без кнопок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=71:71)
     */
    readonly buttonAddButtonsPresetLikeDislike = '👍 / 👎'
}

export class AdminMenuMailingPreview {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=74:74)
     */
    readonly text =
        'Чтобы задать дополнительную задержку перед отправкой сообщения каждому пользователю введите команду /delay и количество секунд\n<i>Например <code>/delay 5</code> будет означать 5 секунд задержки</i>\n\nТекущая задержка: <b>delaySec</b> сек\n\nВаше сообщение в рассылке будет выглядеть так:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=75:75)
     */
    readonly buttonSave = 'Сохранить (время жизни 2 нед.)'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=76:76)
     */
    readonly buttonStartMailing = 'Отправить прямо сейчас'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=77:77)
     */
    readonly textPreformedMessageSaved = 'Заготовка сохранена:\nId: `messageId`\nShortId: `shortId`'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=78:78)
     */
    readonly textAfterStartMailing =
        'Рассылка успешно стартовала!\nЗа ходом рассылки можете наблюдать в обновляющемся сообщении в чате link'
}
export class AdminMenuMailingPreviewWithParams {
    constructor(private readonly base: AdminMenuMailingPreview) {}
    /**
     * @value: Чтобы задать дополнительную задержку перед отправкой сообщения каждому пользователю введите команду /delay и количество секунд\n<i>Например <code>/delay 5</code> будет означать 5 секунд задержки</i>\n\nТекущая задержка: <b>delaySec</b> сек\n\nВаше сообщение в рассылке будет выглядеть так:
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=74:74)
     */
    text(args: { delaySec: number }): string {
        return this.base.text.replaceAll('delaySec', `${args.delaySec}`)
    }
    /**
     * @value: Сохранить (время жизни 2 нед.)
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=75:75)
     */
    get buttonSave(): string {
        return this.base.buttonSave
    }
    /**
     * @value: Отправить прямо сейчас
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=76:76)
     */
    get buttonStartMailing(): string {
        return this.base.buttonStartMailing
    }
    /**
     * @value: Заготовка сохранена:\nId: `messageId`\nShortId: `shortId`
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=77:77)
     */
    textPreformedMessageSaved(args: { messageId: string; shortId: string }): string {
        return this.base.textPreformedMessageSaved
            .replaceAll('messageId', `${args.messageId}`)
            .replaceAll('shortId', `${args.shortId}`)
    }
    /**
     * @value: Рассылка успешно стартовала!\nЗа ходом рассылки можете наблюдать в обновляющемся сообщении в чате link
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=78:78)
     */
    textAfterStartMailing(args: { link: string }): string {
        return this.base.textAfterStartMailing.replaceAll('link', `${args.link}`)
    }
}

export class AdminMenuMetrics {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=81:81)
     */
    readonly selectDateText = 'Выберите опцию'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=82:82)
     */
    readonly selectDateMonth = 'Месяц'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=83:83)
     */
    readonly selectDateQuarter = 'Квартал'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=84:84)
     */
    readonly selectDateYear = 'Год'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=85:85)
     */
    readonly selectDateYearPrevious = 'Предыдущий год'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=86:86)
     */
    readonly getUsersInfo = 'Пользователи'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=87:87)
     */
    readonly getRedirectStat = 'Редикерт ссылки'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=88:88)
     */
    readonly getMainStat = 'Общая статистика'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=89:89)
     */
    readonly textChosePeriod = 'Выберите период'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=90:90)
     */
    readonly waitForStatistic =
        'Идет формирование таблицы\nТаблица будет отправлена вам сразу как будет готова'
}

export class AdminForum {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=93:93)
     */
    readonly messageFromAdmin = '👋 Вам пишет администратор <b>adminName</b>'
    /**
     * @description Количество минут, после которого к сообщению от админа будет добавлена приписка с его именем
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=94:94)
     */
    readonly messageFromAdminTimeout = '15'
    /**
     * @description Команда для модераторов, используется чтобы продублировать в топике форума информацию по старым и текущему топику пользователя
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=95:95)
     */
    readonly pinTopicHistoryMessage = '/pinTopicInfo'
}
export class AdminForumWithParams {
    constructor(private readonly base: AdminForum) {}
    /**
     * @value: 👋 Вам пишет администратор <b>adminName</b>
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=93:93)
     */
    messageFromAdmin(args: { adminName: string }): string {
        return this.base.messageFromAdmin.replaceAll('adminName', `${args.adminName}`)
    }
    /**
     * @value: 15
     * @description Количество минут, после которого к сообщению от админа будет добавлена приписка с его именем
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=94:94)
     */
    get messageFromAdminTimeout(): string {
        return this.base.messageFromAdminTimeout
    }
    /**
     * @value: /pinTopicInfo
     * @description Команда для модераторов, используется чтобы продублировать в топике форума информацию по старым и текущему топику пользователя
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=95:95)
     */
    get pinTopicHistoryMessage(): string {
        return this.base.pinTopicHistoryMessage
    }
}

export class SurveyContinue {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=98:98)
     */
    readonly text = 'Продолжить заполнение заявки или начать заново?'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=99:99)
     */
    readonly buttonBeginning = 'Начать заново'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=100:100)
     */
    readonly buttonResume = 'Продолжить'
}

export class SurveyDescription {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=102:102)
     */
    readonly text =
        'Вам нужно ответить на несколько вопросов\n\nВы можете в любой момент вернуться в главное меню при помощи команды /back_to_menu и позже продолжить заполнение страницы без потери прогресса\n\nЕсли вы ранее уже заполняли эту анкету, на следующем шаге вам будет предложено продолжить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=103:103)
     */
    readonly buttonStart = 'Приступить'
}

export class Survey {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=105:105)
     */
    readonly buttonOptionalQuestionSkip = '👀 Пропустить вопрос'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=106:106)
     */
    readonly buttonBackToPreviousQuestion = '↩️ Изменить выбор'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=107:107)
     */
    readonly buttonInlineSkip = '👀 Пропустить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=108:108)
     */
    readonly buttonInlineBackToPrevious = '↩️ Вернуться'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=109:109)
     */
    readonly textInlineSkipEventLog = '<i>👀 Вопрос пропущен</i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=110:110)
     */
    readonly textInlineBackToPreviousEventLog = '<i>↩️ Предыдущий вопрос</i>'
    /**
     * @description Сообщение, которое будет выведено пользователю, если он ввёл текст в ответ на вопрос, где надо дать число
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=111:111)
     */
    readonly errorMessageAnswerIsNotNumber =
        'Введите число\nЕсли вам нужно указать дробное значение, то отделите его точкой или запятой\n\n<i>Пример: 123.4</i>'
}

export class SurveyQuestionMedia {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=113:113)
     */
    readonly commonFilled = '✅ Фото <b>загружено</b>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=114:114)
     */
    readonly buttonDone = 'Продолжить 👉'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=115:115)
     */
    readonly buttonEdit = '🔄 Редактировать'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=116:116)
     */
    readonly buttonEditModeExit = 'Отмена'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=117:117)
     */
    readonly textFilesCountPrefix = 'Загружено файлов:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=118:118)
     */
    readonly textEditMode = 'Выберите файл, который хотите удалить'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=119:119)
     */
    readonly textDeleteAllFiles = 'Удалить все файлы'
}

export class SurveyQuestionMultipleChoice {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=121:121)
     */
    readonly textSelectionFalse = '⬜'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=122:122)
     */
    readonly textSelectionTrue = '✅'
    /**
     * @description Текст, который будет добавлен к вопросу типа multipleChoice.
     * minCount - минимальное количество пунктов, которые надо выбрать
     * maxCount - максимальное количество пунктов, которые можно выбрать
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=123:123)
     */
    readonly textDescription = 'Вы можете выбрать от minCount до maxCount пунктов'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=124:124)
     */
    readonly textSelectionPrefix = 'Вы выбрали:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=125:125)
     */
    readonly textMaxCountReached = 'Вы выбрали максимальное число вариантов'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=126:126)
     */
    readonly textMinCountDoesNotReached =
        'Вам нужно выбрать еще несколько вариантов чтобы продолжить'
}
export class SurveyQuestionMultipleChoiceWithParams {
    constructor(private readonly base: SurveyQuestionMultipleChoice) {}
    /**
     * @value: ⬜
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=121:121)
     */
    get textSelectionFalse(): string {
        return this.base.textSelectionFalse
    }
    /**
     * @value: ✅
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=122:122)
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
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=123:123)
     */
    textDescription(args: { minCount: number; maxCount: number }): string {
        return this.base.textDescription
            .replaceAll('minCount', `${args.minCount}`)
            .replaceAll('maxCount', `${args.maxCount}`)
    }
    /**
     * @value: Вы выбрали:
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=124:124)
     */
    get textSelectionPrefix(): string {
        return this.base.textSelectionPrefix
    }
    /**
     * @value: Вы выбрали максимальное число вариантов
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=125:125)
     */
    get textMaxCountReached(): string {
        return this.base.textMaxCountReached
    }
    /**
     * @value: Вам нужно выбрать еще несколько вариантов чтобы продолжить
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=126:126)
     */
    get textMinCountDoesNotReached(): string {
        return this.base.textMinCountDoesNotReached
    }
}

export class SurveyFinal {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=128:128)
     */
    readonly textMediaAnswerForSkippedQuestion = 'Вы пропустили вопрос'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=129:129)
     */
    readonly textMediaPrefix = 'Медиа'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=130:130)
     */
    readonly textMediaUnit = 'шт.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=131:131)
     */
    readonly textOptionalAnswerIsNull = '<i>Не указано</i>'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=132:132)
     */
    readonly text =
        '👆🏻 Данные из твоей заявки готовы к отправке\n\nУбедись, что все правильно и <b>нажми "✅Отправить"</b>\n\nЕсли нужно изменить какое-то поле – нажми на кнопку с его названием'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=133:133)
     */
    readonly buttonInlineEdit = '🔄 questionTitle'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=134:134)
     */
    readonly buttonDone = '✅ Отправить'
}
export class SurveyFinalWithParams {
    constructor(private readonly base: SurveyFinal) {}
    /**
     * @value: Вы пропустили вопрос
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=128:128)
     */
    get textMediaAnswerForSkippedQuestion(): string {
        return this.base.textMediaAnswerForSkippedQuestion
    }
    /**
     * @value: Медиа
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=129:129)
     */
    get textMediaPrefix(): string {
        return this.base.textMediaPrefix
    }
    /**
     * @value: шт.
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=130:130)
     */
    get textMediaUnit(): string {
        return this.base.textMediaUnit
    }
    /**
     * @value: <i>Не указано</i>
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=131:131)
     */
    get textOptionalAnswerIsNull(): string {
        return this.base.textOptionalAnswerIsNull
    }
    /**
     * @value: 👆🏻 Данные из твоей заявки готовы к отправке\n\nУбедись, что все правильно и <b>нажми "✅Отправить"</b>\n\nЕсли нужно изменить какое-то поле – нажми на кнопку с его названием
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=132:132)
     */
    get text(): string {
        return this.base.text
    }
    /**
     * @value: 🔄 questionTitle
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=133:133)
     */
    buttonInlineEdit(args: { questionTitle: string }): string {
        return this.base.buttonInlineEdit.replaceAll('questionTitle', `${args.questionTitle}`)
    }
    /**
     * @value: ✅ Отправить
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=134:134)
     */
    get buttonDone(): string {
        return this.base.buttonDone
    }
}

export class SurveyQuestionGptTip {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=136:136)
     */
    readonly textWaitingForGptAnswer = 'Формулирую ответ...'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=137:137)
     */
    readonly textStartMenu =
        'Бот может помочь Вам ответить на этот вопрос\nДля начала нужно кратко изложить основную мысль, если трудно сделать это сразу - бот задаст вам дополнительные вопросы'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=138:138)
     */
    readonly buttonStartMenuContinue = '😊 Отлично, приступаю!'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=139:139)
     */
    readonly buttonStartMenuGptTip = '🤔 Помоги собраться с мыслями'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=140:140)
     */
    readonly promptStartMenuGptTipTemperature = '0.4'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=141:141)
     */
    readonly promptStartMenuGptTip =
        'Я прохожу опрос для заполнения ...\n\nСООБЩЕНИЕ ОБЯЗАТЕЛЬНО ДОЛЖНО СОДЕРЖАТЬ КАК МИНИМУМ 3 ВОПРОСА ВОПРОСЫ ДОЛЖНЫ ПОДРАЗУМЕВАТЬ РАЗВЕРНУТЫЙ ОТВЕТ ОТВЕЧАЙ ОТ ЛИЦА БОТА, ПРИШЛИ ТОЛЬКО ИТОГОВОЕ СООБЩЕНИЕ.\nТебе НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ В СВОЁМ ОТВЕТЕ ФРАЗЫ:"ВОПРОСЫ ПОЛЬЗОВАТЕЛЮ", "ПРИМЕР СООБЩЕНИЯ"\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=142:142)
     */
    readonly textStartMenuEnterMessage =
        'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=143:143)
     */
    readonly textAnswerEditing = 'Отлично!\nВот что у вас получилось:'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=144:144)
     */
    readonly buttonAnswerEditingDone = '👍 Мне нравится, можем идти дальше'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=145:145)
     */
    readonly buttonAnswerEditingUpdateWithGpt = '🧐 Попробуй улучшить мой ответ'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=146:146)
     */
    readonly buttonAnswerEditingRestart = '👀 Хочу ответить на вопрос заново'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=147:147)
     */
    readonly textUpdateWithGptWishes = 'Есть ли у Вас дополнительные пожелания'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=148:148)
     */
    readonly buttonUpdateWithGptWishesYes = '🤔 Да, сейчас расскажу'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=149:149)
     */
    readonly buttonUpdateWithGptWishesNo = '👨‍🎨 Сделай на свой вкус'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=150:150)
     */
    readonly textUpdateWithGptWishesEnter =
        'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=151:151)
     */
    readonly promptUpdateWithGptTemperature = '0.4'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=152:152)
     */
    readonly promptUpdateWithGpt =
        'Я прохожу опрос\nСделай мой ответ более развернутым\n\nВ ОТВЕТЕ НЕ ДОЛЖНО БЫТЬ НИЧЕГО ЛИШНЕГО, ТОЛЬКО ОТВЕТ НА ВОПРОС.\nОБЯЗАТЕЛЬНО УЧИТЫВАЙ МОИ ПОЖЕЛАНИЯ\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=153:153)
     */
    readonly textUpdateWithGptSaveResult = 'Как Вам результат?'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=154:154)
     */
    readonly buttonUpdateWithGptSaveResultYes = '👍 Мне нравится'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=155:155)
     */
    readonly buttonUpdateWithGptSaveResultTryAgain = '🧐 Попробуй ещё раз'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=156:156)
     */
    readonly buttonUpdateWithGptSaveResultNo = '😓 Прошлый вариант был лучше'
}

export class SurveyQuestionPhoneNumber {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=157:157)
     */
    readonly text =
        '<b>Вы можете отправить</b>📱📞 номер телефона <b>текстовым сообщением</b> в формате +7 999 999 99 99\nИЛИ <b>поделиться им через кнопку в нижнем меню</b> 👇'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=158:158)
     */
    readonly buttonSendContact = 'Использовать номер телефона, привязанный к Telegram'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=159:159)
     */
    readonly buttonEnterPhoneNumber = 'Ввести самостоятельно'
    /**
     * @description Сообщение, которое будет выведено пользователю, если он ввёл не номер телефона
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=160:160)
     */
    readonly textEnterPhoneNumber = 'Введите номер телефона'
    /**
     * @description Сообщение, которое будет выведено пользователю, если он ввёл не номер телефона
     *
     * [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=161:161)
     */
    readonly errorMessageAnswerIsNotPhoneNumber =
        'Ответом на этот вопрос обязательно должен быть номер телефона'
}

export class Training {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=164:164)
     */
    readonly textStart = 'Обучение\n\n✅ пройденный урок\n☑️ непройденный урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=165:165)
     */
    readonly buttonContinue = 'Следующий урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=166:166)
     */
    readonly buttonBackToPreviousStep = 'Предыдущий урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=167:167)
     */
    readonly indicatorParagraphPassed = '✅'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=168:168)
     */
    readonly indicatorParagraphCurrent = '☑️'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=169:169)
     */
    readonly indicatorParagraphNext = '☑️'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=170:170)
     */
    readonly buttonSelectStep = 'Выбрать урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=171:171)
     */
    readonly buttonFinal = 'Завершить обучение'
}

export class TrainingStart {
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=172:172)
     */
    readonly startButtonShowFromBeginning = 'Смотреть по очереди'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=173:173)
     */
    readonly startButtonShowLastStep = 'Мой последний урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=174:174)
     */
    readonly startButtonSelectStep = 'Выбрать урок'
    /**
     * @description [Spreadsheet row link](https://docs.google.com/spreadsheets/d/1z4Rkun7e9MrTo4RbkjKpKuVXPUGFvalvs6dAkLltdz4/edit#gid=0&range=175:175)
     */
    readonly startMenuText = 'Вы в меню'
}

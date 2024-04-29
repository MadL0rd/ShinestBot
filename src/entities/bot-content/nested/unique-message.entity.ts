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
    readonly surveyDescription = new SurveyDescription()
    readonly survey = new Survey()
    readonly surveyQuestionMedia = new SurveyQuestionMedia()
    readonly surveyFinal = new SurveyFinal()
    readonly surveyQuestionGptTip = new SurveyQuestionGptTip()
    readonly moderationCommand = new ModerationCommand()
    readonly moderation = new Moderation()
    readonly userPublications = new UserPublications()
    readonly moderationEditing = new ModerationEditing()
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
    readonly symbolCross = '❌'
    readonly symbolCheckMark = '✅'
}

export class MainMenu {
    readonly text = 'Ты оказался в главном меню 😊'
    readonly textAbout = 'https://github.com/MadL0rd/ShinestBot'
    readonly buttonAbout = '📂 Репозиторий'
    readonly buttonAdminMenu = '🔐 Меню администратора'
    readonly buttonLanguageSettings = '🌎 Выбрать другой язык'
    readonly buttonSurvey = '📝 Пройти опрос'
    readonly userPublications = '📰 Управление публикациями'
    readonly editPublicationAsAdmin = '📰 Редактирование заявки'
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

export class SurveyDescription {
    readonly text = 'Вам нужно ответить на несколько вопросов, чтобы бот помог вам заполнить страницу памяти на сайте MemoryCode.ru\n\nВы можете в любой момент вернуться в главное меню при помощи команды /back_to_menu и позже продолжить заполнение страницы без потери прогресса\n\nЕсли вы ранее уже заполняли эту анкету, на следующем шаге вам будет предложено продолжить'
    readonly buttonStart = 'Приступить'
}

export class Survey {
    readonly buttonOptionalQuestionSkip = '👀 Пропустить'
    readonly buttonBackToPreviousQuestion = '⬅️ Вернуться к предыдущему вопросу'
    readonly texMessageAditionaltInlineMenu = '🧭 Навигация'
    readonly buttonAditionaltInlineMenuSkip = '👀 Пропустить'
    readonly buttonAditionaltInlineMenuBackToPrevious = '⬆️ Вернуться'
    readonly textAditionaltInlineMenuSkipEventLog = '<i>👀 Вопрос пропущен</i>'
    readonly textAditionaltInlineMenuBackToPreviousEventLog = '<i>⬆️ Возврат к предыдущему вопросу</i>'
    /** Сообщение, которое будет выведено пользователю, если он ввёл текст в ответ на вопрос, где надо дать число */
    readonly errorMessageAnswerIsNotNumber = 'Введите число\nЕсли вам нужно указать дробное значение, то отделите его точкой или запятой\n\n<i>Пример: 123.4</i>'
}

export class SurveyQuestionMedia {
    readonly buttonDone = '✅ Готово'
    readonly buttonEdit = '🔄 Редактировать'
    readonly buttonEditModeExit = 'Отмена'
    readonly textFilesCountPrefix = 'Загружено файлов:'
    readonly textEditMode = 'Выберите файл, который хотите удалить'
}

export class SurveyFinal {
    readonly textMediaPrefix = 'Медиа'
    readonly textMediaUnit = 'шт.'
    readonly textOptionalAnswerIsNull = '<i>Не указано</i>'
    readonly text = '👆🏻 Выше все данные из вашей заявки.\nВы можете отправить её в текущем виде либо отредактировать.\n\nЧтобы отредактировать какой-то пункт, отправьте мне его номер.\n\n<i>P.S.: Вы можете вернуться в главное меню и отредактировать заявку позже, просто при возвращении нажмите кнопку *Опрос*, а затем *Продолжить*</i>'
    readonly buttonDone = 'Отправить'
}

export class SurveyQuestionGptTip {
    readonly textWaitingForGptAnswer = 'Формулирую ответ...'
    readonly textStartMenu = 'Бот может помочь Вам ответить на этот вопрос\nДля начала нужно кратко изложить основную мысль, если трудно сделать это сразу - бот задаст вам дополнительные вопросы'
    readonly buttonStartMenuContinue = '😊 Отлично, приступаю!'
    readonly buttonStartMenuGptTip = '🤔 Помоги собраться с мыслями'
    readonly promptStartMenuGptTipTemperature = '0.4'
    readonly promptStartMenuGptTip = 'Я прохожу опрос для заполнения страницы посвященной памяти погибшего родственника.\nЯ уже увидел вопрос, но не смог сформулировать ответ самостоятельно, задай мне несколько наводящих вопросов чтобы помочь собраться с мыслями.\nЕсли информации достаточно, используй при формировании подсказок ответы на предыдущие вопросы.\n\nСООБЩЕНИЕ ОБЯЗАТЕЛЬНО ДОЛЖНО СОДЕРЖАТЬ КАК МИНИМУМ 3 ВОПРОСА ВОПРОСЫ ДОЛЖНЫ ПОДРАЗУМЕВАТЬ РАЗВЕРНУТЫЙ ОТВЕТ ОТВЕЧАЙ ОТ ЛИЦА БОТА, ПРИШЛИ ТОЛЬКО ИТОГОВОЕ СООБЩЕНИЕ.\nТебе НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ В СВОЁМ ОТВЕТЕ ФРАЗЫ:"ВОПРОСЫ ПОЛЬЗОВАТЕЛЮ", "ПРИМЕР СООБЩЕНИЯ"\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    readonly textStartMenuEnterMessage = 'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    readonly textAnswerEditing = 'Отлично!\nВот что у вас получилось:'
    readonly buttonAnswerEditingDone = '👍 Мне нравится, можем идти дальше'
    readonly buttonAnswerEditingUpdateWithGpt = '🧐 Попробуй улучшить мой ответ'
    readonly buttonAnswerEditingRestart = '👀 Хочу ответить на вопрос заново'
    readonly textUpdateWithGptWishes = 'Есть ли у Вас дополнительные пожелания'
    readonly buttonUpdateWithGptWishesYes = '🤔 Да, сейчас расскажу'
    readonly buttonUpdateWithGptWishesNo = '👨‍🎨 Сделай на свой вкус'
    readonly textUpdateWithGptWishesEnter = 'Напишите ваш ответ текстом или отправьте голосовое сообщение'
    readonly promptUpdateWithGptTemperature = '0.4'
    readonly promptUpdateWithGpt = 'Я прохожу опрос для заполнения страницы посвященной памяти умершего родственника. \nНужно помочь мне развёрнуто ответить на вопрос.\nЕсли информации достаточно, используй ответы на предыдущие вопросы.\n\nВ ОТВЕТЕ НЕ ДОЛЖНО БЫТЬ НИЧЕГО ЛИШНЕГО, ТОЛЬКО ОТВЕТ НА ВОПРОС.\nОБЯЗАТЕЛЬНО УЧИТЫВАЙ МОИ ПОЖЕЛАНИЯ\n\nДалее данные: код языка, на котором нужно ОБЯЗАТЕЛЬНО перевести твое сообщение ЦЕЛИКОМ; текущий вопрос; мои ответы на предыдущие вопросы.'
    readonly textUpdateWithGptSaveResult = 'Как Вам результат?'
    readonly buttonUpdateWithGptSaveResultYes = '👍 Мне нравится'
    readonly buttonUpdateWithGptSaveResultTryAgain = '🧐 Попробуй ещё раз'
    readonly buttonUpdateWithGptSaveResultNo = '😓 Прошлый вариант был лучше'
}

export class ModerationCommand {
    /** Команда для чата модерации */
    readonly approve = 'Принять'
    /** Команда для чата модерации */
    readonly place = 'Опубликовать'
    /** Команда для чата модерации */
    readonly reject = 'Отклонить'
    /** Команда для чата модерации */
    readonly notRelevant = 'Не актуально'
    /** Команда для чата модерации */
    readonly edit = 'Редактировать'
}

export class Moderation {
    /** Описание команды Опубликовать */
    readonly commandPlaceDescriptionText = 'Команда *Опубликовать* позволяет выложить пост в канал, имя которого будет указано после команды (или цифры, под которой значится эта команда)\n\nПример: Опубликовать @MostRentChannel'
    /** Плейсхолдер */
    readonly messageAdvertIdPlaceholder = 'advertIdPlaceholder'
    /** Плейсхолдер */
    readonly messageAddressPlaceholder = 'addressPlaceholder'
    /** Плейсхолдер */
    readonly messagePostLinkPlaceholder = 'postLinkPlaceholder'
    /** Плейсхолдер */
    readonly messagePostStatusPlaceholder = 'advertStatusPlaceholder'
    /** Плейсхолдер */
    readonly messagePostDatePlaceholder = 'advertCreationDatePlaceholder'
    /** Плейсхолдер */
    readonly messagePostIdPlaceholder = 'postIdPlaceholder'
    readonly publicationStatusCreated = '🧾 Создана'
    readonly publicationStatusModeration = '📝 Проверка'
    readonly publicationStatusRejected = '🚫 Отклонено'
    readonly publicationStatusActive = '✅ Актуально'
    readonly publicationStatusNotRelevant = '❌ Не актуально'
    readonly publicationTextLink = '[Ссылка на публикацию](postLinkPlaceholder)'
    readonly messageText = '📩 *Сообщение от команды ShinestBot*\n\nID публикации: *advertIdPlaceholder*\nДата подачи заявки: advertCreationDatePlaceholder'
    readonly messageTextModeration = 'Ваше объявление было успешно отправлено на модерацию\n\nID: *advertIdPlaceholder*\nДата подачи заявки: advertCreationDatePlaceholder\n'
    readonly messageTextAccepted = '🎉 *Поздравляем* 🎉\nВаше объявление было принято\n\nID: *advertIdPlaceholder*\nДата подачи заявки: advertCreationDatePlaceholder'
    readonly messageTextRejected = '🚫 *Внимание* 🚫\nВаше объявление было Отклонено\n\nID: *advertIdPlaceholder*\nДата подачи заявки: advertCreationDatePlaceholder'
    readonly messageTextNotRelevant = '⚠️ *Внимание* ⚠️\nВаше объявление было отмечено как неактуальное\n\nID: *advertIdPlaceholder*\nДата подачи заявки: advertCreationDatePlaceholder'
    readonly moderationMessageTextNewSearchResult = '✅ *Внимание* ✅\nПоявилось новая публикация, подходящая под ваши фильтры'
    readonly moderationMessagePublicationEdited = '✅ *Внимание* ✅\n\nЗаявка была обновлена'
}

export class UserPublications {
    readonly text = 'Ваши объявления:'
    readonly textEmpty = 'Вы еще не подавали объявлений'
    readonly textModeratorContact = 'Напишите мне ваш вопрос, ответ модераторатора придёт вам вместе с уведомлением\n\nДля отмены текущего действия нажмите /cancel'
    readonly advertInfoFormat = 'ID: *advertIdPlaceholder*\nСтатус: advertStatusPlaceholder\nДата подачи заявки: advertCreationDatePlaceholder'
    readonly advertInfoLinkFormat = '[Ссылка на публикацию](postLinkPlaceholder)'
    readonly buttonSetStatusNotRelevant = '❌ Отметить как неактуальное '
    readonly buttonReuseAdvert = '✏ Отредактировать и отправить повторно'
    readonly writeToModerator = 'Написать модератору'
    readonly buttonLinkWeb = '🌎 Посмотреть на сайте'
    readonly buttonLinkTelegram = '➡️ Перейти к публикации'
    readonly writeToModeratorError = 'Не удалось отправить ваше сообщение\nПопробуйте еще раз'
    readonly writeToModeratorSuccess = 'Сообщение успешно отправлено'
    readonly finalOptionalAnswerIsNull = '<i>Не указано</i>'
}

export class ModerationEditing {
    readonly text = 'Приступить к редактированию заявки?\nid: <b>postIdPlaceholder</b>'
    readonly textEmpty = 'В данный момент вы не редактируете ни одну заявку'
    readonly buttonStartEditing = 'Приступить'
}

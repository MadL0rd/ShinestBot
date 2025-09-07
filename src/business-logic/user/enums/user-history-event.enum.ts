import { StartParam } from 'src/entities/start-param'
import { sceneCallbackDataCompressedSchema } from 'src/presentation/scenes/models/scene-callback'
import { SceneEntrance } from 'src/presentation/scenes/models/scene-entrance.interface'
import { SceneName } from 'src/presentation/scenes/models/scene-name.enum'
import { Opts, Telegram } from 'telegraf/types'
import z from 'zod'

export namespace UserHistoryEvent {
    export type BaseType = Events
    export type EventTypeName = Events['type']

    export type SomeEventType<EventName extends EventTypeName> = Extract<
        Events,
        { type: EventName }
    >

    type TelegramApiCallInfo<Method extends keyof Telegram> = {
        method: Method
        args: Opts<Method>
        result:
            | { success: true; result: ReturnType<Telegram[Method]> }
            | { success: false; error: unknown }
    }
    type SomeTelegramApiCallInfo = TelegramApiCallInfo<keyof Telegram>

    type Events =
        | {
              /**
               * @description Первый запуск бота
               */
              type: 'userCreated'
              startParamString: string | null
              startParam: StartParam.BaseType | null
          }
        | {
              /**
               * @description Запустил бота
               */
              type: 'start'
              startParamString: string | null
              startParam: StartParam.BaseType | null
          }
        | {
              /**
               * @description Бот был заблокирован пользователем
               */
              type: 'botBlocked'
          }
        | {
              /**
               * @description Бот был разблокирован пользователем
               */
              type: 'botUnblocked'
          }
        | {
              /**
               * @description Телеграм пользователь деактивирован
               */
              type: 'userIsDeactivated'
          }
        | {
              /**
               * @description Отправил сообщение
               */
              type: 'sendMessage'
              text: string | undefined
              message: object
          }
        | {
              /**
               * @description Переход в сцену
               */
              type: 'enterScene'
              sceneName: SceneName.Union
              sceneEntranceDto: Record<string, unknown> & SceneEntrance.Dto
          }
        | {
              /**
               * @description Нажал на кнопку в сообщении
               */
              type: 'callbackButtonDidTapped'
              data: string | undefined
              dataParsed: z.infer<typeof sceneCallbackDataCompressedSchema> | undefined
          }
        | {
              /**
               * @description Открыл WebApp
               */
              type: 'userOpenWebApp'
              webAppType: string
          }
        | {
              /**
               * @description Вызов метода Telegram API в приватном диалоге с пользователем
               */
              type: 'directDialogApiCall'
              actorTelegramId: number | undefined
              apiCall: SomeTelegramApiCallInfo
          }
        | {
              /**
               * @description Сцена не смогла обработать сообщение пользователя (будет отправлено в поддержку)
               */
              type: 'sceneCanNotHandleUserUpdate'
              sceneName: SceneName.Union
              telegramUpdate: Record<string, unknown>
          }
        | {
              /**
               * @description Менеджер отправил сообщение пользователю
               */
              type: 'managerSendMessageToUser'
              targetUserTelegramId: number
              messageType: string
              text: string | undefined
          }
        | {
              /**
               * @description Пользователь стал целью сообщения менеджера
               */
              type: 'userWasManagerMessageTarget'
              actorTelegramId: number // manager
              messageType: string
              text: string | undefined
          }
        | {
              /**
               * @description Перенаправлен на
               */
              type: 'redirectLink'
              alias: string
              redirectUrl: string
              utm: Record<string, string>
          }
        | {
              /**
               * @description Начал отвечать на вопрос
               */
              type: 'surveyQuestionWasShown'
              providerType: 'registration'
              questionId: string
          }
        | {
              /**
               * @description Дал ответ на вопрос
               */
              type: 'surveyQuestionUserGaveAnAnswer'
              providerType: 'registration'
              questionId: string
          }
        | {
              /**
               * @description Завершил опрос регистрации
               */
              type: 'surveyFormSubmit'
              providerType: 'registration'
          }
        | {
              /**
               * @description Перешел в параграф
               */
              type: 'selectedParagraph'
              paragraphId: string
          }
        | {
              /**
               * @description Поделился контактом
               */
              type: 'sendPhone'
              messageType: 'text' | 'contact'
              phone: string | undefined
          }
        | {
              /**
               * @description Указал причину, по которой не хочет стать парковым смз
               */
              type: 'pressMailingMessageInlineButton'
              buttonId: string
              mailingMessageShortId: string
          }
}

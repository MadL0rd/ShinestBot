import { Opts, Telegram } from 'telegraf/types'
import { TelegramDdi, TelegramPrivateChatApiMethods, TgCallAsyncResult } from './telegram-ddi-types'

// Declare an interface that extends TelegramDdi
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
declare interface TelegramDirectDialogInteractorAbstract extends TelegramDdi {}

// Declare an abstract class with the base structure
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
abstract class TelegramDirectDialogInteractorAbstract {
    constructor(public readonly userTelegramId: number) {}

    // Abstract method to call the Telegram API
    protected abstract callApi<Method extends keyof Telegram>(
        method: Method,
        args: Opts<Method>
    ): TgCallAsyncResult<Method>
}

/**
 * Inject TelegramDdi methods into the prototype
 */
{
    const methods = TelegramPrivateChatApiMethods.allCases
    const ddiPrototype = TelegramDirectDialogInteractorAbstract.prototype

    // Helper function to inject a method into the prototype
    const injectMethod = <Method extends TelegramPrivateChatApiMethods.Union>(
        method: Method,
        paramKey: 'chat_id' | 'user_id'
    ) => {
        // @ts-expect-error: Dynamic method injection
        ddiPrototype[method] = async function (args: any) {
            return this.callApi(method, { [paramKey]: this.userTelegramId, ...args })
        }
    }

    // Inject methods that require 'chat_id'
    methods.methodsWithParamChatId.forEach((method) => injectMethod(method, 'chat_id'))

    // Inject methods that require 'user_id'
    methods.methodsWithParamUserId.forEach((method) => injectMethod(method, 'user_id'))
}

/**
 * Due to Declaration Merging, the interface and abstract class are merged,
 * resulting in a combined interface with all methods from TelegramDdi.
 */
export { TelegramDirectDialogInteractorAbstract }

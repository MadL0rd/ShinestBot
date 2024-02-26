import { Context } from 'telegraf'
import { Update } from 'node_modules/telegraf/typings/core/types/typegram'

export interface IDispatcher {
    handleUserStart(ctx: Context<Update>): Promise<void>
    handleUserMessage(ctx: Context<Update>): Promise<void>
    handleUserCallback(ctx: Context<Update.CallbackQueryUpdate>): Promise<void>
}

import { Context } from 'telegraf'

export interface IDispatcher {
    handleUserStart(ctx: Context): Promise<void>
    handleUserMessage(ctx: Context): Promise<void>
    handleUserCallback(ctx: Context): Promise<void>
}

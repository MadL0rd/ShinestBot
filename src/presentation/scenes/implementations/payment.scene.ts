import { Message, Update } from 'telegraf/typings/core/types/typegram'
import { Markup, Context } from 'telegraf'
import { SceneName } from '../enums/scene-name.enum'
import { SceneHandlerCompletion, Scene, SceneCallbackData } from '../scene.interface'
import { logger } from 'src/app.logger'
import { internalConstants } from 'src/app.internal-constants'
import { ItemModel } from 'src/core/bot-content/schemas/models/bot-content.exercises'

// =====================
// Scene data class
// =====================

interface ISceneData {
    itemList?: ItemModel[]
}

export class PaymentScene extends Scene<ISceneData> {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.payment
    get dataDefault(): ISceneData {
        return this.generateData({
            itemList: [],
        })
    }

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        await this.logToUserHistory(this.historyEvent.startScenePayment)

        const itemList: ItemModel[] = []
        itemList.push({
            id: '1',
            price: 10000,
            title: 'Что-то за 100р',
            buttonText: 'Купить что-то за 100р',
        })
        itemList.push({
            id: '2',
            price: 20000,
            title: 'Что-то за 200р',
            buttonText: 'Купить что-то за 200р',
        })
        itemList.push({
            id: '3',
            price: 30000,
            title: 'Что-то за 300р',
            buttonText: 'Купить что-то за 300р',
        })

        const buttons = itemList.map((sub) => sub.buttonText)
        buttons.push(this.text.common.buttonBackToPreviousMenu)

        console.log('kek')

        await ctx.replyWithHTML(
            `${this.content.uniqueMessage.payment.text}`,
            this.keyboardMarkupWithAutoLayoutFor(buttons)
        )
        return this.completion.inProgress(this.generateData({ itemList: itemList }))
    }

    async handleMessage(ctx: Context<Update>, dataRaw: object): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleMessage. User: ${this.user.telegramInfo.id} ${this.user.telegramInfo.username}`
        )
        const data = this.restoreData(dataRaw)

        const message = ctx.message as Message.TextMessage
        if (!message.text) return this.completion.canNotHandle(data)
        if (message.text == this.text.common.buttonBackToPreviousMenu)
            return this.completion.complete(SceneName.mainMenu)

        const chosenVariant = data.itemList.find((sub) => sub.buttonText == message.text)
        if (!chosenVariant) return this.completion.complete()

        await ctx.sendInvoice({
            title: chosenVariant.buttonText,
            description: chosenVariant.title,
            payload: chosenVariant.id,
            provider_token: internalConstants.paymentProviderToken,
            currency: 'rub',
            prices: [
                {
                    label: chosenVariant.buttonText,
                    amount: chosenVariant.price,
                },
            ],
        })

        await this.userService.logToUserHistory(this.user, this.historyEvent.startPurchase, {
            packageId: chosenVariant.id,
            subscriptionVariantId: chosenVariant.id,
            price: chosenVariant.price,
        })
        return this.completion.inProgress(data)
    }

    async handleCallback(
        ctx: Context<Update.CallbackQueryUpdate>,
        dataRaw: SceneCallbackData
    ): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================
}

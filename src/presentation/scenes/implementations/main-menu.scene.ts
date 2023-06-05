import { Context } from 'telegraf'
import { Message, ReplyKeyboardMarkup, Update } from 'telegraf/typings/core/types/typegram'
import { SceneName } from '../enums/scene-name.enum'
import { IScene, SceneHandlerCompletion, Scene } from '../scene.interface'
import { Markup } from 'telegraf'
import { logger } from 'src/app.logger'

// =====================
// Scene data class
// =====================
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ISceneData {}

export class MainMenuScene extends Scene {
    // =====================
    // Properties
    // =====================

    readonly name: SceneName = SceneName.mainMenu

    // =====================
    // Public methods
    // =====================

    async handleEnterScene(ctx: Context<Update>): Promise<SceneHandlerCompletion> {
        logger.log(
            `${this.name} scene handleEnterScene. User: ${ctx.from.id} ${ctx.from.username}`
        )
        ctx.replyWithMarkdownV2(
            `Started *${this.name}* scene ${this.name}`,
            super.keyboardMarkupWithAutoLayoutFor([
                'Givno',
                'Zalupa',
                'Penis',
                'Her',
                'Davalka',
                'Hui',
                'Bliadina',
            ])
        )

        return this.completion.inProgress({})
    }

    async handleMessage(ctx: Context<Update>, dataRaw: Object): Promise<SceneHandlerCompletion> {
        logger.log(`${this.name} scene handleMessage. User: ${ctx.from.id} ${ctx.from.username}`)

        return this.completion.canNotHandle({})
    }

    async handleCallback(ctx: Context<Update>, dataRaw: Object): Promise<SceneHandlerCompletion> {
        throw new Error('Method not implemented.')
    }

    // =====================
    // Private methods
    // =====================

    private generateData(data: ISceneData): ISceneData {
        return data
    }

    private restoreData(dataRaw: object): ISceneData {
        const data: ISceneData = dataRaw as ISceneData
        return data
    }
}

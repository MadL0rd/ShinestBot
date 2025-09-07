import { Deunionize } from 'node_modules/telegraf/typings/core/helpers/deunionize'
import { logger } from 'src/app/app.logger'
import { UserService } from 'src/business-logic/user/user.service'
import { BotContent } from 'src/entities/bot-content'
import { StartParam } from 'src/entities/start-param'
import { ExtendedMessageContext } from 'src/utils/telegraf-middlewares/extended-message-context'
import { SceneEntrance } from '../models/scene-entrance.interface'
import { SceneName } from '../models/scene-name.enum'
import { SceneUsagePermissionsValidator } from '../models/scene-usage-permissions-validator'
import { Scene } from '../models/scene.abstract'
import { SceneHandlerCompletion } from '../models/scene.interface'
import { InjectableSceneConstructor } from '../scene-factory/scene-injections-provider.service'

// =====================
// Scene data classes
// =====================

type OnboardingTypes = BotContent.Onboarding.PagesGroupType.Union
export class OnboardingSceneEntranceDto implements SceneEntrance.Dto {
    readonly sceneName = 'onboarding'
    readonly type: OnboardingTypes
}
type SceneEnterDataType = OnboardingSceneEntranceDto
type ISceneData = {
    onboardingPageIndex: number
    continueButtonText: string
    readonly type: OnboardingTypes
}

// =====================
// Scene main class
// =====================

@InjectableSceneConstructor()
export class OnboardingScene extends Scene<ISceneData, SceneEnterDataType> {
    // =====================
    // Properties
    // =====================

    override readonly name: SceneName.Union = 'onboarding'
    protected override get dataDefault(): ISceneData {
        return {} as ISceneData
    }
    protected override get permissionsValidator(): SceneUsagePermissionsValidator.IPermissionsValidator {
        return new SceneUsagePermissionsValidator.CanUseIfNotBanned()
    }

    constructor(protected override readonly userService: UserService) {
        super()
    }

    // =====================
    // Public methods
    // =====================

    override async handleEnterScene(data?: SceneEnterDataType): Promise<SceneHandlerCompletion> {
        if (!data) {
            logger.error(
                `Start data corrupted. User ${this.user.telegramInfo.username}. Redirection to main menu`
            )
            return this.completion.complete()
        }

        const onboardingContent = this.getOnboardingContent(data.type)
        if (!onboardingContent) {
            logger.error(
                `Cannot find onboarding content with name ${data.type}. Redirection to next scene ${this.getNextScene(data.type)}`
            )
            return this.completion.complete(this.getNextScene(data.type))
        }

        if (onboardingContent.isEmpty) {
            return this.completion.complete(this.getNextScene(data.type))
        }

        let onboardingPageIndex = 0
        for (const page of onboardingContent) {
            await this.showOnboardingPage(page)
            onboardingPageIndex = onboardingContent.indexOf(page)
            if (page.buttonText) {
                return this.completion.inProgress({
                    onboardingPageIndex: onboardingPageIndex,
                    continueButtonText: page.buttonText,
                    type: data.type,
                })
            } else {
                continue
            }
        }

        return this.completion.complete(this.getNextScene(data.type))
    }

    override async handleMessage(
        ctx: ExtendedMessageContext,
        dataRaw: object
    ): Promise<SceneHandlerCompletion> {
        const data = this.restoreData(dataRaw)
        const onboardingContent = this.getOnboardingContent(data.type)
        if (!onboardingContent) {
            logger.error(
                `Cannot find onboarding content with name ${data.type}. Redirection to next scene ${this.getNextScene(data.type)}`
            )
            return this.completion.complete(this.getNextScene(data.type))
        }
        const message = ctx.message
        if (message.type !== 'text') return this.completion.canNotHandle()

        if (data.continueButtonText === message.text) {
            let nextPageIndex = data.onboardingPageIndex + 1
            if (!onboardingContent[nextPageIndex]) {
                return this.completion.complete(this.getNextScene(data.type))
            }

            for (const page of onboardingContent.slice(nextPageIndex)) {
                await this.showOnboardingPage(page)
                nextPageIndex = onboardingContent.indexOf(page)
                if (page.buttonText) {
                    return this.completion.inProgress({
                        onboardingPageIndex: nextPageIndex,
                        continueButtonText: page.buttonText,
                        type: data.type,
                    })
                } else {
                    continue
                }
            }

            return this.completion.complete(this.getNextScene(data.type))
        }

        return this.completion.canNotHandle()
    }

    // =====================
    // Private methods
    // =====================

    private async showOnboardingPage(page?: BotContent.Onboarding.Page): Promise<void> {
        if (!page) return

        if (page.messageText) {
            await this.ddi.sendHtml(page.messageText, {
                link_preview_options: { is_disabled: page.disableWebPagePreview },
                reply_markup: page.buttonText
                    ? super.keyboardMarkupWithAutoLayoutFor([page.buttonText]).reply_markup
                    : undefined,
            })
        }

        await this.ddi.sendMediaContent(page.media)
    }

    private getOnboardingContent(type: OnboardingTypes): BotContent.Onboarding.Page[] | undefined {
        const startParam: Deunionize<StartParam.BaseType> | null | undefined = this.user.startParam
        const filterData = {
            utm: startParam?.utm.compact ?? [],
        }
        const haveCommonItems = (array1: string[], array2: string[]) => {
            return (
                array1.isNotEmpty &&
                array2.isNotEmpty &&
                array1.find((value) => array2.includes(value))
            )
        }
        const availableGroups = this.content.onboardingGroups
            .filter(
                (group) => group.haveFilters === false || haveCommonItems(filterData.utm, group.utm)
            )
            .sort((x1, x2) => x2.priority - x1.priority)

        let targetGroup: BotContent.Onboarding.PagesGroup | undefined = undefined
        switch (type) {
            case 'onStart':
                targetGroup = availableGroups.find((group) => group.type === 'onStart')
                break
        }

        return targetGroup
            ? this.content.onboardingPages.filter((page) => page.groupId === targetGroup.groupId)
            : []
    }

    private getNextScene(type: OnboardingTypes): SceneEntrance.SomeSceneDto {
        switch (type) {
            case 'onStart':
                return {
                    sceneName: 'mainMenu',
                }
        }
    }
}

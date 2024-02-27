import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BotContent, BotContentDocument, BotContentStable } from './schemas/bot-content.schema'
import { GoogleTablesService } from '../google-tables/google-tables.service'
import { SpreadsheetPageTitles } from '../google-tables/enums/spreadsheet-page-titles'
import { CreateBotContentDto } from './dto/create-bot-content.dto'
import { UpdateBotContentDto } from './dto/update-bot-content.dto'
import { logger } from 'src/app.logger'
import { UniqueMessage } from './schemas/models/bot-content.unique-message'
import { internalConstants } from 'src/app.internal-constants'
import { LocalizationService } from '../localization/localization.service'
import { OnboardingPage } from './schemas/models/bot-content.onboarding-page'
import { MediaContent } from './schemas/models/bot-content.media-content'

@Injectable()
export class BotContentService implements OnModuleInit {
    // =====================
    // Initializer
    // =====================

    private botContentCache: Map<string, BotContentStable>

    constructor(
        @InjectModel(BotContent.name) private model: Model<BotContent>,
        private readonly googleTablesService: GoogleTablesService,
        private readonly localizationService: LocalizationService
    ) {
        this.botContentCache = new Map<string, BotContentStable>()
    }

    async onModuleInit(): Promise<void> {
        if (internalConstants.cacheBotContentOnStart == false) return

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        const loadingPromises = SpreadsheetPageTitles.allKeys.map((pageName) => {
            const cacheSpreadsheetFunc = async function (): Promise<void> {
                try {
                    await self.cacheSpreadsheetPage(pageName)
                } catch (error) {
                    logger.error(`Fail to cache spreadsheet page ${pageName}`, error)
                }
            }
            return cacheSpreadsheetFunc()
        })
        await Promise.all(loadingPromises)
    }

    // =====================
    // Public methods
    // =====================

    async getLocalLanguages(): Promise<string[]> {
        const botContent = await this.model.find({}).select({ language: 1 }).lean().exec()
        return botContent.compactMap((content) => content.language)
    }

    async getContent(language: string): Promise<BotContentStable> {
        const contentCache = this.botContentCache.get(language)
        if (contentCache) {
            return contentCache
        }
        const contentPage = await this.findOneBy(language)
        if (!contentPage) {
            if (language == internalConstants.defaultLanguage) throw Error('No content')
            return await this.getContent(internalConstants.defaultLanguage)
        }

        this.botContentCache.set(language, contentPage)
        return contentPage
    }

    async cacheSpreadsheetPage(pageName: SpreadsheetPageTitles.keysUnion) {
        switch (pageName) {
            case 'uniqueMessages':
                await this.cacheUniqueMessage()
                break

            case 'onboarding':
                await this.cacheOnboarding()
                break
        }
        this.botContentCache = new Map<string, BotContentStable>()
    }

    // =====================
    // Private methods:
    // Database
    // =====================

    private async create(createBotContentDto: CreateBotContentDto): Promise<BotContent> {
        return this.model.create(createBotContentDto)
    }

    private async update(
        updateBotContentDto: UpdateBotContentDto,
        existingContent: BotContentDocument
    ): Promise<BotContent | unknown> {
        return this.model
            .updateOne({ _id: existingContent._id }, updateBotContentDto, { new: true })
            .exec()
    }

    private async findOneBy(lang: string): Promise<BotContent | null> {
        return this.model.findOne({ language: lang }).exec()
    }

    // =====================
    // Private methods:
    // Google spreadsheets
    // =====================

    private async cacheUniqueMessage() {
        await this.localizationService.cacheLocalization()

        const uniqueMessageObj = new UniqueMessage()
        type UniqueMessageGroupKeys = keyof typeof uniqueMessageObj
        const uniqueMessageGroupStringKeys = Object.keys(
            uniqueMessageObj
        ) as unknown as UniqueMessageGroupKeys[]

        const languages = await this.localizationService.getRemoteLanguages()
        for (const language of languages) {
            for (const groupNameString of uniqueMessageGroupStringKeys) {
                const groupName = groupNameString as UniqueMessageGroupKeys
                const localizedGroup = await this.localizationService.findOneByGroupName(groupName)
                if (!localizedGroup) {
                    throw Error(`There is no localized strings group with name ${groupName}`)
                }

                const uniqueMessageGroup = uniqueMessageObj[groupName] as unknown as Record<
                    string,
                    string
                >
                const uniqueMessageStringKeys = Object.keys(uniqueMessageGroup)

                for (const uniqueMessageStringKey of uniqueMessageStringKeys) {
                    const localizedString = localizedGroup.content[uniqueMessageStringKey]
                    if (!localizedString)
                        throw Error(
                            `There is no value for\ngroup: ${groupName};\nkey: ${uniqueMessageStringKey};\nlang: ${language}`
                        )
                    const localizedUniqueMessage = localizedString?.localizedValues[language]
                    if (!localizedUniqueMessage) {
                        throw Error(
                            `Remote table does not contains text for\nLanguage: ${language}\nGroup: ${groupName}\nKey: ${uniqueMessageStringKey}`
                        )
                    }
                    uniqueMessageGroup[uniqueMessageStringKey] = localizedUniqueMessage
                }
                // @ts-ignore: Unreachable code error
                uniqueMessageObj[groupName] = uniqueMessageGroup
            }

            const createBotContentDto = {
                language: language,
                uniqueMessage: uniqueMessageObj,
            }

            const existingContent = await this.model.findOne({ language: language }).exec()
            if (existingContent && !existingContent.isNew) {
                await this.update(createBotContentDto, existingContent)
            } else {
                await this.create(createBotContentDto)
            }
        }
    }

    private async cacheOnboarding() {
        const content = await this.googleTablesService.getContentByListName('onboarding', 'A2:F50')
        if (!content) throw Error('No content')
        const onboardingContent = this.createOnboardingArray(content)

        // TODO: add localized content for collections
        const languages = await this.localizationService.getRemoteLanguages()
        for (const language of languages) {
            const createBotContentDto: CreateBotContentDto = {
                language: language,
                onboarding: onboardingContent,
            }

            const existingContent = await this.model.findOne({ language: language }).exec()
            if (existingContent && !existingContent.isNew) {
                await this.update(createBotContentDto, existingContent)
            } else {
                await this.create(createBotContentDto)
            }
        }
    }

    /** Map spreadsheet content to OnboardingPage array */
    private createOnboardingArray(googleRows: string[][]): OnboardingPage[] {
        let onbordingArray: OnboardingPage[] = []
        for (const element of googleRows) {
            if (element.length < 1) {
                continue
            }
            const onboardinjObj: OnboardingPage = {
                id: element[0],
                messageText: element[1],
                buttonText: element[2],
                media: this.createMediaContentFromCells(element[3], element[4], element[5]),
            }
            if (!onbordingArray) {
                onbordingArray = [onboardinjObj]
            } else {
                onbordingArray.push(onboardinjObj)
            }
        }
        return onbordingArray
    }

    private createMediaContentFromCells(
        videosCell?: string,
        imagesCell?: string,
        audioCell?: string,
        documentsCell?: string
    ): MediaContent {
        return {
            videos:
                videosCell
                    ?.split('\n')
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0) ?? [],
            images:
                imagesCell
                    ?.split('\n')
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0) ?? [],
            audio:
                audioCell
                    ?.split('\n')
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0) ?? [],
            documents:
                documentsCell
                    ?.split('\n')
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0) ?? [],
        }
    }
}

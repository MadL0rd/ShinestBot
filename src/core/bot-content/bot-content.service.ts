import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BotContent, BotContentDocument, BotContentStable } from './schemas/bot-content.schema'
import { DataSheetPrototype } from '../sheet-data-provider/schemas/data-sheet-prototype'
import { CreateBotContentDto } from './dto/create-bot-content.dto'
import { UpdateBotContentDto } from './dto/update-bot-content.dto'
import { logger } from 'src/app.logger'
import { UniqueMessage } from './schemas/models/bot-content.unique-message'
import { internalConstants } from 'src/app.internal-constants'
import { LocalizationService } from '../localization/localization.service'
import { OnboardingPage } from './schemas/models/bot-content.onboarding-page'
import { MediaContent } from './schemas/models/bot-content.media-content'
import { SheetDataProviderService } from '../sheet-data-provider/sheet-data-provider.service'

@Injectable()
export class BotContentService implements OnModuleInit {
    // =====================
    // Initializer
    // =====================

    private readonly cachedTrueValue = 'TRUE'
    private botContentCache: Map<string, BotContentStable>

    constructor(
        @InjectModel(BotContent.name) private model: Model<BotContent>,
        private readonly sheetDataProvider: SheetDataProviderService,
        private readonly localizationService: LocalizationService
    ) {
        this.botContentCache = new Map<string, BotContentStable>()
    }

    async onModuleInit(): Promise<void> {
        if (internalConstants.cacheBotContentOnStart == false) return

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        try {
            await this.localizationService.cacheLocalization()
        } catch (error) {
            logger.error(`Fail to cache localization`, error)
            return
        }
        const loadingPromises = DataSheetPrototype.allPagesContent.map(async (pageName) => {
            const cacheSpreadsheetFunc = async function (): Promise<void> {
                try {
                    await self.cacheSpreadsheetPage(pageName)
                } catch (error) {
                    logger.error(`Fail to cache spreadsheet page ${pageName}`, error)
                }
            }
            return await cacheSpreadsheetFunc()
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

    async cacheSpreadsheetPage(pageName: DataSheetPrototype.SomePageContent) {
        switch (pageName) {
            case 'uniqueMessagesContent':
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

    private async createOrUpdateExisting(
        language: string,
        createBotContentDto: CreateBotContentDto
    ) {
        const existingContent = await this.model.findOne({ language: language }).exec()
        if (existingContent && !existingContent.isNew) {
            await this.update(createBotContentDto, existingContent)
        } else {
            await this.create(createBotContentDto)
        }
    }

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

    /** Needs to clear all old BotContent models with unsupported languages from database */
    private async useOnlySupportedLanguages(currentLanguages: string[]) {
        const dbLanguages = await this.getLocalLanguages()
        for (const dbLanguage of dbLanguages) {
            if (currentLanguages.includes(dbLanguage)) continue
            await this.model.deleteOne({ language: dbLanguage }).exec()
            this.botContentCache = new Map<string, BotContentStable>()
        }
    }

    // =====================
    // Private methods:
    // Google spreadsheets
    // =====================

    private async cacheUniqueMessage() {
        // Cache data from table
        const sheetPage: DataSheetPrototype.SomePageContent = 'uniqueMessagesContent'
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content || content.isEmpty) throw Error('No content')

        const localizedContentByLanguage =
            await this.localizationService.localizeDataSheetRowsArray(content, {
                type: 'byItemGroupAndKey',
                page: sheetPage,
                groupField: 'group',
                keyField: 'key',
                localizationSchema: {
                    group: { type: 'originalContent' },
                    key: { type: 'originalContent' },
                    comment: { type: 'originalContent' },
                    params: { type: 'originalContent' },
                    isUniqueMessage: { type: 'originalContent' },
                    defaultValue: { type: 'byItemGroupAndKey' },
                    defaultValueLanguage: { type: 'originalContent' },
                },
            })

        // Prepare prototype for validation
        const uniqueMessagePrototype = new UniqueMessage() as any as Record<
            string,
            Record<string, string>
        >
        const uniqueMessagePrototypeGroupKeyStrings: string[] = []
        for (const group of Object.keys(uniqueMessagePrototype)) {
            for (const key of Object.keys(uniqueMessagePrototype[group])) {
                uniqueMessagePrototypeGroupKeyStrings.push(`Group: '${group}' Key: '${key}'`)
            }
        }
        uniqueMessagePrototypeGroupKeyStrings.sort()

        // Combine and save UniqueMessage localized objects
        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language].filter(
                (rowItem) => rowItem.isUniqueMessage === this.cachedTrueValue
            )
            if (!contentRowsLocalized) {
                throw Error(`Fatal error: content corrupted`)
            }
            const tableRowsGroupKeyStrings = contentRowsLocalized
                .map((rowItem) => {
                    return `Group: '${rowItem.group}' Key: '${rowItem.key}'`
                })
                .sort()

            // Validate remote and local data
            if (uniqueMessagePrototypeGroupKeyStrings != tableRowsGroupKeyStrings) {
                const remoteTableAbsentValues = uniqueMessagePrototypeGroupKeyStrings.filter(
                    (prototypeStringKey) =>
                        tableRowsGroupKeyStrings.includes(prototypeStringKey) == false
                )
                if (remoteTableAbsentValues.isNotEmpty) {
                    const jsonString = JSON.stringify(remoteTableAbsentValues, null, 2)
                    throw Error(`Table does not contains some unique messages:\n${jsonString}`)
                }

                const prototypeAbsentValues = tableRowsGroupKeyStrings.filter(
                    (prototypeStringKey) =>
                        uniqueMessagePrototypeGroupKeyStrings.includes(prototypeStringKey) == false
                )
                if (prototypeAbsentValues.isNotEmpty) {
                    const jsonString = JSON.stringify(prototypeAbsentValues, null, 2)
                    logger.warn(`UniqueMessage class does not contains some values:\n${jsonString}`)
                }
            }

            const uniqueMessagePrecastObject: Record<string, Record<string, string>> = {}
            for (const uniqueMessageRow of contentRowsLocalized) {
                if (!uniqueMessagePrecastObject[uniqueMessageRow.group]) {
                    uniqueMessagePrecastObject[uniqueMessageRow.group] = {}
                }
                uniqueMessagePrecastObject[uniqueMessageRow.group][uniqueMessageRow.key] =
                    uniqueMessageRow.defaultValue
            }

            // Write result
            await this.createOrUpdateExisting(language, {
                language: language,
                uniqueMessage: uniqueMessagePrecastObject as unknown as UniqueMessage,
            })
        }

        await this.useOnlySupportedLanguages(languages)
    }

    private async cacheOnboarding() {
        const sheetPage: DataSheetPrototype.SomePageContent = 'onboarding'
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content || content.isEmpty) throw Error('No content')
        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty)
            throw Error(`Ids duplicated in Onboarding page: ${idsDuplicated}`)
        const localizedContentByLanguage =
            await this.localizationService.localizeDataSheetRowsArray(content, {
                type: 'byItemId',
                page: sheetPage,
                group: 'onboarding',
                itemIdField: 'id',
                localizationSchema: {
                    id: { type: 'originalContent' },
                    messageText: { type: 'byIdAndFieldName' },
                    buttonText: {
                        type: 'byIdAndFieldNameForArray',
                        arrayItemsSeparator: '\n',
                        arrayItemComponentsSeparator: '/',
                        arrayItemIdIndex: 0,
                    },
                    video: { type: 'byIdAndFieldName' },
                    picture: { type: 'byIdAndFieldName' },
                    audio: { type: 'byIdAndFieldName' },
                    docs: { type: 'byIdAndFieldName' },
                },
            })

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Fatal error: content corrupted`)
            }
            const resultContent = contentRowsLocalized.map((rowItem) => {
                const result: OnboardingPage = {
                    id: rowItem.id,
                    messageText: rowItem.messageText,
                    buttonText: rowItem.buttonText,
                    media: this.createMediaContentFromCells(
                        rowItem.picture,
                        rowItem.video,
                        rowItem.audio,
                        rowItem.docs
                    ),
                }
                return result
            })

            // Write result
            await this.createOrUpdateExisting(language, {
                language: language,
                onboarding: resultContent,
            })
        }
        await this.useOnlySupportedLanguages(languages)
    }

    private createMediaContentFromCells(
        imagesCell?: string,
        videosCell?: string,
        audioCell?: string,
        documentsCell?: string
    ): MediaContent {
        return {
            images:
                imagesCell
                    ?.split('\n')
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0) ?? [],
            videos:
                videosCell
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

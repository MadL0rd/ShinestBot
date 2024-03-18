import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BotContent, BotContentDocument, BotContentStable } from './schemas/bot-content.schema'
import { DataSheetPrototype } from '../../core/sheet-data-provider/schemas/data-sheet-prototype'
import { CreateBotContentDto } from './dto/create-bot-content.dto'
import { UpdateBotContentDto } from './dto/update-bot-content.dto'
import { logger } from 'src/app/app.logger'
import { UniqueMessage } from './schemas/models/bot-content.unique-message'
import { internalConstants } from 'src/app/app.internal-constants'
import { LocalizationService } from '../../core/localization/localization.service'
import { OnboardingPage } from './schemas/models/bot-content.onboarding-page'
import { MediaContent } from './schemas/models/bot-content.media-content'
import { SheetDataProviderService } from '../../core/sheet-data-provider/sheet-data-provider.service'
import { Survey, SurveyCacheHelpers } from './schemas/models/bot-content.survey'

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

            case 'survey':
                await this.cacheSurvey()
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
                    buttonText: { type: 'byIdAndFieldName' },
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

    private async cacheSurvey() {
        const sheetPage: DataSheetPrototype.SomePageContent = 'survey'
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content || content.isEmpty) throw Error('No content')
        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty)
            throw Error(`Ids duplicated in Onboarding page: ${idsDuplicated}`)
        const localizedContentByLanguage =
            await this.localizationService.localizeDataSheetRowsArray(content, {
                type: 'byItemId',
                page: sheetPage,
                group: sheetPage,
                itemIdField: 'id',
                localizationSchema: {
                    id: { type: 'originalContent' },
                    isRequired: { type: 'originalContent' },
                    questionText: { type: 'byIdAndFieldName' },
                    publicTitle: { type: 'byIdAndFieldName' },
                    answerType: { type: 'originalContent' },
                    answerParams: {
                        type: 'byIdAndFieldNameForArray',
                        itemsSeparator: '\n',
                        itemComponentsSeparator: '/',
                        itemIdIndex: 0,
                        needToBeLocalizedPrefix: '$',
                    },
                    filters: { type: 'originalContent' },
                    showInPublicationTelegram: { type: 'originalContent' },
                },
            })

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Fatal error: content corrupted`)
            }
            const resultContent = contentRowsLocalized.map((rowItem) => {
                const rowAnswerType =
                    SurveyCacheHelpers.answerTypeNameByPublicName[rowItem.answerType]
                const rowItemString = JSON.stringify(rowItem, null, 2)
                if (!rowAnswerType) {
                    throw Error(`Unsupported unser type: ${rowItem.answerType}\n${rowItemString}`)
                }
                let answerType: Survey.AnswerType

                let useIdAsPublicationTag: boolean | undefined
                let unit: string | undefined
                let maxCount: number | undefined

                const answerParams =
                    rowItem.answerParams
                        ?.split('\n')
                        .map((param) => {
                            const paramStrings = param.split('/').map((item) => item.trimmed)
                            return {
                                id: paramStrings[0],
                                value: paramStrings[1] ?? '',
                            }
                        })
                        .filter((answerParam) => {
                            // Detect and filter special params
                            switch (answerParam.id) {
                                case 'useIdAsPublicationTag':
                                    useIdAsPublicationTag = true
                                    return false

                                case 'unit':
                                    unit = answerParam.value
                                    if (!unit) {
                                        throw Error(
                                            `Question answerOptions contains empty option 'unit'\n${rowItemString}`
                                        )
                                    }
                                    return false

                                case 'maxCount':
                                    maxCount = Number(answerParam.value)
                                    if (Number.isNaN(maxCount) || !maxCount || maxCount < 1) {
                                        throw Error(
                                            `Question answerOptions contains wrong option 'maxCount'\n${rowItemString}`
                                        )
                                    }
                                    return false
                            }
                            return true
                        }) ?? []

                switch (rowAnswerType) {
                    case 'string':
                        answerType = {
                            name: 'string',
                        }
                        break
                    case 'answerOptions':
                        const answerOptions = answerParams.map((answerParam) => {
                            if (answerParam.value.isEmpty) {
                                throw Error(
                                    `Question with type answerOptions contains empty option with id: ${answerParam.id}\n${rowItemString}`
                                )
                            }
                            const option: Survey.AnswerOption = {
                                id: answerParam.id,
                                text: answerParam.value,
                            }
                            return option
                        })
                        if (answerParams.isEmpty) {
                            throw Error(
                                `Question with type answerOptions does not contains options\n${rowItemString}`
                            )
                        }
                        answerType = {
                            name: 'answerOptions',
                            options: answerOptions,
                            useIdAsPublicationTag: useIdAsPublicationTag ?? false,
                        }
                        break
                    case 'numeric':
                        answerType = {
                            name: 'numeric',
                        }
                        break
                    case 'image':
                        if (!maxCount) {
                            throw Error(
                                `Question with type 'image' does not contain option 'maxCount'\n${rowItemString}`
                            )
                        }
                        answerType = {
                            name: 'image',
                            mediaMaxCount: maxCount,
                        }
                        break

                    case 'video':
                        if (!maxCount) {
                            throw Error(
                                `Question with type 'image' does not contain option 'maxCount'\n${rowItemString}`
                            )
                        }
                        answerType = {
                            name: 'video',
                            mediaMaxCount: maxCount,
                        }
                        break

                    case 'mediaGroup':
                        if (!maxCount) {
                            throw Error(
                                `Question with type 'image' does not contain option 'maxCount'\n${rowItemString}`
                            )
                        }
                        answerType = {
                            name: 'mediaGroup',
                            mediaMaxCount: maxCount,
                        }
                        break
                }

                let filters: Survey.Filter[] = []
                if (rowItem.filters && rowItem.filters.isNotEmpty) {
                    filters = rowItem.filters
                        .split('\n')
                        .map((filterLine) => filterLine.trimmed)
                        .filter((filterLine) => filterLine.isNotEmpty)
                        .map((filterLine) => {
                            const lineComponents = filterLine
                                .split('/')
                                .map((option: string) => option.trimmed)

                            if (
                                lineComponents.length < 3 ||
                                lineComponents[1].isEmpty ||
                                lineComponents[2].isEmpty
                            ) {
                                throw Error(`Question filters is not correct\n${rowItemString}`)
                            }
                            return {
                                targetQuestionId: lineComponents[1],
                                validOptionIds: lineComponents[2].split('|').map((value) => {
                                    const result = value.trimmed
                                    if (result.isEmpty) {
                                        throw Error(
                                            `Question filters is not correct\n${rowItemString}`
                                        )
                                    }
                                    return result
                                }),
                            }
                        })
                }

                const result: Survey.Question = {
                    id: rowItem.id,
                    required: rowItem.isRequired == this.cachedTrueValue,
                    questionText: rowItem.questionText,
                    publicTitle: rowItem.publicTitle,
                    answerType: answerType,
                    filters: filters,
                    addAnswerToTelegramPublication: false,
                }
                return result
            })

            // Validate filters
            for (const question of resultContent) {
                if (question.filters.isEmpty) continue
                for (const filter of question.filters) {
                    const targetQuestion = resultContent.find((question) => {
                        return question.id == filter.targetQuestionId
                    })
                    if (!targetQuestion) {
                        const questionString = JSON.stringify(question, null, 2)
                        throw Error(
                            `Question filters contains undefiend id: ${filter.targetQuestionId}\n${questionString}`
                        )
                    }
                    if (targetQuestion.answerType.name != 'answerOptions') {
                        const questionString = JSON.stringify(question, null, 2)
                        throw Error(
                            `Question filters contains answerId '${targetQuestion.id}' but type of target question answer is not 'answerOptions'\n${questionString}`
                        )
                    }
                    for (const validOptionId of filter.validOptionIds) {
                        const targetQuestionContainsValidValue =
                            targetQuestion.answerType.options.some(
                                (option) => option.id == validOptionId
                            )
                        if (targetQuestionContainsValidValue) continue

                        const questionString = JSON.stringify(question, null, 2)
                        throw Error(
                            `Question filters contains option id '${validOptionId}' but target question answer options does not contains same id\n${questionString}`
                        )
                    }
                }
            }

            // Write result
            await this.createOrUpdateExisting(language, {
                language: language,
                survey: { questions: resultContent },
            })
        }
        await this.useOnlySupportedLanguages(languages)
    }

    // =====================
    // Private methods:
    // Helpers
    // =====================

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

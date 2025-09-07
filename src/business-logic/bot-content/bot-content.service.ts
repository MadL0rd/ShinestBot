import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { internalConstants } from 'src/app/app.internal-constants'
import { logger } from 'src/app/app.logger'
import { BotContent } from 'src/entities/bot-content'
import { UniqueMessagePrimitive } from 'src/entities/bot-content/nested/unique-message.entity'
import { Nullish } from 'src/entities/common/nullish-prop.type'
import { SameTypeFields } from 'src/entities/common/pick-same-type-fields'
import { ExtractCases } from 'src/entities/common/utility-types-extensions'
import { UserProfile } from 'src/entities/user-profile'
import z from 'zod'
import { DataSheetPrototype } from '../../core/sheet-data-provider/schemas/data-sheet-prototype'
import { SheetDataProviderService } from '../../core/sheet-data-provider/sheet-data-provider.service'
import { BotContentDto } from './dto/bot-content.dto'
import { BotContentDocument, BotContentSchema } from './schemas/bot-content.schema'

@Injectable()
export class BotContentService implements OnModuleInit {
    // =====================
    // Initializer
    // =====================

    private botContentCache: Map<string, BotContent.BaseType>
    public readonly contentCachePriority: DataSheetPrototype.SomePageContent[][]

    constructor(
        @InjectModel(BotContentSchema.name) private model: Model<BotContentSchema>,
        private readonly sheetDataProvider: SheetDataProviderService
    ) {
        this.botContentCache = new Map<string, BotContent.BaseType>()

        const priorityPages: DataSheetPrototype.SomePageContent[] = [
            'onboardingGroups',
            'redirectLinks',
        ]
        this.contentCachePriority = [
            priorityPages,
            DataSheetPrototype.allPagesContent.filter(
                (page) => priorityPages.includes(page).isFalse
            ),
        ]
    }

    async onModuleInit(): Promise<void> {
        const documentsCount = await this.model.countDocuments()
        if (documentsCount === 0) {
            await this.createOrUpdateExisting({
                language: internalConstants.sheetContent.defaultLanguage,
            })
        }

        if (internalConstants.sheetContent.cacheBotContentOnStart === false) return

        for (const pagesBatch of this.contentCachePriority) {
            await pagesBatch
                .map((pageName) => {
                    return this.cacheSpreadsheetPage(pageName).catch((error) => {
                        logger.error(`Fail to cache spreadsheet page ${pageName}`, error)
                    })
                })
                .combinePromises()
        }
    }

    // =====================
    // Public methods
    // =====================

    async getLocalLanguages(): Promise<string[]> {
        const botContent = await this.model.find({}).select({ language: 1 }).lean().exec()
        return botContent.compactMap((content) => content.language)
    }

    async getContent(language?: string): Promise<BotContent.BaseType> {
        language = language ?? internalConstants.sheetContent.defaultLanguage
        const contentCache = this.botContentCache.get(language)
        if (contentCache) {
            return contentCache
        }
        const contentPagePrimitive = await this.findOneBy(language)
        if (!contentPagePrimitive) {
            if (language === internalConstants.sheetContent.defaultLanguage) {
                throw Error(`No bot content with language ${language}`)
            }
            return await this.getContent(internalConstants.sheetContent.defaultLanguage)
        }

        const contentPage = BotContent.Helper.insertBotContentMethods(contentPagePrimitive)
        this.botContentCache.set(language, contentPage)
        return contentPage
    }

    async getContentForUser(user: Nullish<UserProfile.BaseType>) {
        const userLanguage = UserProfile.Helper.getLanguageFor(user)
        return await this.getContent(userLanguage)
    }

    async cacheSpreadsheetPage(pageName: DataSheetPrototype.SomePageContent) {
        await this.contentCacheFunctions[pageName]()
        this.botContentCache.clear()
    }

    // =====================
    // Private methods:
    // Database
    // =====================

    private async createOrUpdateExisting(dto: BotContentDto) {
        await this.model.updateOne({ language: dto.language }, dto, { upsert: true }).lean()
    }

    private contentCacheFunctions: Record<DataSheetPrototype.SomePageContent, () => Promise<void>> =
        {
            uniqueMessagesContent: () => this.cacheUniqueMessage(),
            onboardingPages: () => this.cacheOnboardingPages('onboardingPages', 'onboardingPages'),
            onboardingGroups: () =>
                this.cacheOnboardingGroups('onboardingGroups', 'onboardingGroups'),
            survey: () => this.cacheSurvey('survey', 'survey'),
            training: () => this.cacheTraining('training', 'training'),
            mainMenuMarkup: () => this.cacheMainMenuMarkup('mainMenuMarkup', 'mainMenuMarkup'),
            redirectLinks: () => this.cacheRedirectLinks('redirectLinks', 'redirectLinks'),
        }

    private async findOneBy(language: string): Promise<BotContentDocument | null> {
        const result = await this.model.findOne({ language }).lean()
        return result
    }

    // =====================
    // Private methods:
    // Google spreadsheets
    // =====================

    private fakeContentLocalization<ContentType>(content: ContentType) {
        return { RU: content } as Record<string, ContentType>
    }

    private async cacheUniqueMessage() {
        // Cache data from table
        const sheetPage: DataSheetPrototype.SomePageContent = 'uniqueMessagesContent'
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content || content.isEmpty) throw Error('No content')

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        // Prepare prototype for validation
        const uniqueMessagePrototype = new UniqueMessagePrimitive() as any as Record<
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
                (rowItem) => rowItem.isUniqueMessage
            )
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
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
                        tableRowsGroupKeyStrings.includes(prototypeStringKey) === false
                )
                if (remoteTableAbsentValues.isNotEmpty) {
                    const jsonString = JSON.stringify(remoteTableAbsentValues, null, 2)
                    throw Error(`Table does not contains some unique messages:\n${jsonString}`)
                }

                const prototypeAbsentValues = tableRowsGroupKeyStrings.filter(
                    (prototypeStringKey) =>
                        uniqueMessagePrototypeGroupKeyStrings.includes(prototypeStringKey) === false
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
            await this.createOrUpdateExisting({
                language: language,
                uniqueMessage:
                    uniqueMessagePrecastObject as unknown as BotContent.UniqueMessagePrimitive,
            })
        }
    }

    private async cacheOnboardingGroups(
        page: ExtractCases<DataSheetPrototype.SomePageContent, 'onboardingGroups'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'onboardingGroups'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content) throw Error('No content')

        if (content.isEmpty) {
            await this.getLocalLanguages().then((languages) =>
                languages.compact
                    .map((language) =>
                        this.createOrUpdateExisting({ language, [contentKeyPath]: [] })
                    )
                    .combinePromises()
            )
            return
        }

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        const stringLinesArraySchema = z
            .string()
            .optional()
            .transform((lines) =>
                lines
                    ? lines
                          .split('\n')
                          .map((str) => str.trim())
                          .filter((str) => str.isNotEmpty).uniqueOnly
                    : []
            )
        const schema = z
            .object({
                groupId: z.string(),
                type: z
                    .enum(['Старт'])
                    .transform((type): BotContent.Onboarding.PagesGroupType.Union => {
                        switch (type) {
                            case 'Старт':
                                return 'onStart'
                        }
                    }),
                priority: z.string().trim().transform(Number).pipe(z.number().min(0)),
                utm: stringLinesArraySchema,
            })
            .transform(
                (item): BotContent.Onboarding.PagesGroup => ({
                    ...item,
                    haveFilters: item.utm.isNotEmpty,
                })
            )
            .array()
            .check((ctx) => {
                const items = ctx.value

                const duplicateIds = items.map((item) => item.groupId).justNotUnique
                if (duplicateIds.isNotEmpty) {
                    ctx.issues.push({
                        code: 'custom',
                        message: `Found groupId duplicates: ${duplicateIds.join(', ')}`,
                        path: [],
                        input: items,
                    })
                }

                for (const groupType of BotContent.Onboarding.PagesGroupType.allCases) {
                    const has = items.some((item) => item.type === groupType)
                    if (!has) {
                        ctx.issues.push({
                            code: 'custom',
                            message: `No group for type: ${groupType}`,
                            path: [],
                            input: items,
                        })
                    }
                }
            })

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
            }
            const resultContent = schema.parse(contentRowsLocalized)

            // Write result
            await this.createOrUpdateExisting({ language, [contentKeyPath]: resultContent })
        }
    }

    private async cacheOnboardingPages(
        page: ExtractCases<DataSheetPrototype.SomePageContent, 'onboardingPages'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'onboardingPages'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content) throw Error('No content')

        if (content.isEmpty) {
            await this.getLocalLanguages().then((languages) =>
                languages
                    .map((language) =>
                        this.createOrUpdateExisting({ language, [contentKeyPath]: [] })
                    )
                    .combinePromises()
            )
            return
        }

        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty)
            throw Error(`Ids duplicated in Onboarding page: ${idsDuplicated}`)

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
            }
            const resultContent = contentRowsLocalized.map((rowItem) => {
                if (!rowItem.messageText && rowItem.buttonText) {
                    throw Error(
                        `Onboarding page without text must not contain buttons:\n${JSON.stringify(rowItem)}`
                    )
                }
                const result: BotContent.Onboarding.Page = rowItem
                return result
            })

            // Write result
            await this.createOrUpdateExisting({ language, [contentKeyPath]: resultContent })
        }
    }

    private async cacheSurvey(
        page: Extract<DataSheetPrototype.SomePageContent, 'survey'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'survey'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider
            .getContentFrom(sheetPage)
            .then((items) =>
                items.filter(
                    (item) =>
                        item.appTagFilter === 'all' ||
                        item.appTagFilter === internalConstants.app.tag
                )
            )
        if (!content || content.isEmpty) throw Error('No content')

        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty) throw Error(`Ids duplicated: ${idsDuplicated}`)
        const localizedContentByLanguage = this.fakeContentLocalization(content)
        const existingSurvey = await this.getContent().then((content) => content.survey?.questions)

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const resultContent = localizedContentByLanguage[language]
            if (!resultContent) {
                throw Error(`Sheet bot content corrupted`)
            }

            // Validate question type changes
            for (const questionNew of resultContent) {
                const existingQuestion = existingSurvey?.find(
                    (question) => question.id === questionNew.id
                )
                if (existingQuestion && existingQuestion.type !== questionNew.type) {
                    throw Error(
                        `The question type with id ${questionNew.id} has been changed. This may lead to errors in the user flow survey. If you want to change the type of question, also change its id.`
                    )
                }
            }

            // Validate filters
            for (const question of resultContent) {
                if (question.filters.isEmpty) continue
                for (const filter of question.filters) {
                    const targetQuestion = resultContent.find((question) => {
                        return question.id === filter.targetQuestionId
                    })
                    if (!targetQuestion) {
                        const questionString = JSON.stringify(question, null, 2)
                        throw Error(
                            `Question filters contains undefined id: ${filter.targetQuestionId}\n${questionString}`
                        )
                    }
                    if (
                        targetQuestion.type != 'options' &&
                        targetQuestion.type != 'optionsInline'
                    ) {
                        const questionString = JSON.stringify(question, null, 2)
                        throw Error(
                            `Question filters contains answerId '${targetQuestion.id}' but type of target question answer is not 'answerOptions'\n${questionString}`
                        )
                    }
                    for (const validOptionId of filter.validOptionIds) {
                        const targetQuestionContainsValidValue = targetQuestion.options.some(
                            (option) => option.id === validOptionId
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
            await this.createOrUpdateExisting({
                language,
                [contentKeyPath]: { contentLanguage: language, questions: resultContent },
            })
        }
    }

    private async cacheTraining(
        page: Extract<DataSheetPrototype.SomePageContent, 'training'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'training'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content || content.isEmpty) throw Error('No content')

        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty) throw Error(`Ids duplicated in Training page: ${idsDuplicated}`)

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
            }

            let chapterCurrent: BotContent.Training.Chapter | undefined
            const resultContent: BotContent.Training.BaseType = { chapters: [], paragraphs: [] }

            contentRowsLocalized.forEach((rowItem, index) => {
                const rowItemString = JSON.stringify(rowItem, null, 2).replaceAll('\\n', '\n')

                switch (rowItem.type) {
                    case BotContent.Helper.Training.contentTypeNames.chapter:
                        // Do not push chapter if it is undefined (0 rows processed)
                        if (chapterCurrent) {
                            if (chapterCurrent.paragraphIds.isEmpty)
                                throw Error(
                                    `Chapter must contains at least 1 paragraph\n${JSON.stringify(chapterCurrent, null, 2)}`
                                )
                            resultContent.chapters.push(chapterCurrent)
                        }
                        chapterCurrent = { id: rowItem.id, name: rowItem.title, paragraphIds: [] }
                        break

                    case BotContent.Helper.Training.contentTypeNames.paragraph: {
                        if (!chapterCurrent) {
                            throw Error(`All paragraphs must belong to chapters\n${rowItemString}`)
                        }
                        if (!rowItem.text || rowItem.text.isEmpty) {
                            throw Error(`Paragraph must contain 'text' property\n${rowItemString}`)
                        }

                        chapterCurrent.paragraphIds.push(rowItem.id)
                        const paragraphContent: BotContent.Training.Paragraph = {
                            id: rowItem.id,
                            chapterId: chapterCurrent.id,
                            name: rowItem.title,
                            text: rowItem.text,
                            media: rowItem.media,
                            disableWebPagePreview: rowItem.disableWebPagePreview,
                        }
                        resultContent.paragraphs.push(paragraphContent)
                        if (index === contentRowsLocalized.length - 1) {
                            if (chapterCurrent.paragraphIds.isEmpty)
                                throw Error(
                                    `Chapter must contains at least 1 paragraph\n${JSON.stringify(chapterCurrent, null, 2)}`
                                )
                            resultContent.chapters.push(chapterCurrent)
                        }
                        break
                    }

                    default: {
                        throw Error(
                            `Chapter type must be one of ['Глава','Параграф']\n${JSON.stringify(chapterCurrent, null, 2)}`
                        )
                    }
                }
            })

            // Write result
            await this.createOrUpdateExisting({ language, [contentKeyPath]: resultContent })
        }
    }

    private async cacheMainMenuMarkup(
        page: Extract<DataSheetPrototype.SomePageContent, 'mainMenuMarkup'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'mainMenuMarkup'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content) throw Error('No content')
        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty)
            throw Error(`Ids duplicated in MainMenuMarkup page: ${idsDuplicated}`)

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
            }

            await this.createOrUpdateExisting({ language, [contentKeyPath]: contentRowsLocalized })
        }
    }

    private async cacheRedirectLinks(
        page: ExtractCases<DataSheetPrototype.SomePageContent, 'redirectLinks'>,
        contentKeyPath: SameTypeFields<BotContent.BaseType, 'redirectLinks'>
    ) {
        const sheetPage: DataSheetPrototype.SomePageContent = page
        const content = await this.sheetDataProvider.getContentFrom(sheetPage)
        if (!content) throw Error('No content')

        if (content.isEmpty) {
            await this.getLocalLanguages().then((languages) =>
                languages
                    .map((language) =>
                        this.createOrUpdateExisting({ language, [contentKeyPath]: [] })
                    )
                    .combinePromises()
            )
            return
        }

        const idsDuplicated = content.map((rowItem) => rowItem.id).justNotUnique
        if (!idsDuplicated.isEmpty)
            throw Error(`Ids duplicated in redirect links page: ${idsDuplicated}`)

        const localizedContentByLanguage = this.fakeContentLocalization(content)

        const languages = Object.keys(localizedContentByLanguage)
        for (const language of languages) {
            const contentRowsLocalized = localizedContentByLanguage[language]
            if (!contentRowsLocalized) {
                throw Error(`Sheet bot content corrupted`)
            }
            const resultContent = contentRowsLocalized.map((rowItem) => {
                const result: BotContent.RedirectLinks.BaseType = {
                    id: rowItem.id,
                    source: rowItem.source,
                }
                return result
            })

            // Write result
            await this.createOrUpdateExisting({ language, [contentKeyPath]: resultContent })
        }
    }
}

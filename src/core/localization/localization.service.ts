import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LocalizedGroup, LocalizedGroupSchema } from './schemas/localization.schema'
import { Model } from 'mongoose'
import { LocalizedGroupDto } from './dto/localized-group.dto'
import { LocalizedString } from './schemas/models/localization.localized-string'
import { logger } from 'src/app/app.logger'
import { SheetDataProviderService } from '../sheet-data-provider/sheet-data-provider.service'
import { DataSheetPrototype } from '../sheet-data-provider/schemas/data-sheet-prototype'
import { DataSheetRowLocalizationSchema } from './schemas/data-sheet-row-localization-schema'
import { LanguageCode } from 'src/utils/languages-info/getLanguageName'

@Injectable()
export class LocalizationService {
    constructor(
        @InjectModel(LocalizedGroupSchema.name) private model: Model<LocalizedGroupSchema>,
        private readonly sheetDataProvider: SheetDataProviderService
    ) {}

    // =====================
    // Public methods
    // =====================

    async findOneByGroupName(groupName: string): Promise<LocalizedGroup | null> {
        return this.model.findOne({ name: groupName }).exec()
    }

    async cacheLocalization() {
        const languages = await this.getRemoteLanguages()
        logger.log(`\nLanguages: ${languages}`)

        const localizationContent = await this.cacheLocalizationRowsCommonArray()
        if (!localizationContent || localizationContent.isEmpty) {
            throw Error('Fail to cache localization strings')
        }

        // Validate localizationContent content have no duplicates of pair group / key
        const allGroupKeyPairsDuplicates = localizationContent.map((rowItem) => {
            return JSON.stringify({
                group: rowItem.group,
                key: rowItem.key,
            })
        }).justNotUnique
        if (allGroupKeyPairsDuplicates.isNotEmpty) {
            throw Error(
                `Fail to cache localizad strings: duplicates found\n${JSON.stringify(
                    allGroupKeyPairsDuplicates
                )}`
            )
        }

        const localizedStrings: LocalizedString[] = localizationContent.map((row) => {
            const localizedString: LocalizedString = {
                groupName: row.group,
                key: row.key,
                comment: row.comment,
                parameters: [],
                localizedValues: row.localizedValues,
            }
            return localizedString
        })
        await this.model.deleteMany({})

        // Create and save localized groups
        const groupNames = localizedStrings.map((value) => value.groupName).uniqueOnly

        for (const groupName of groupNames) {
            await this.createOrUpdate({
                name: groupName,
                languages: Object.keys(localizedStrings.first?.localizedValues ?? {}),
                content: localizedStrings
                    .filter((value) => value.groupName == groupName)
                    .generateItemsRecord((localizedString) => localizedString.key),
            })
        }
    }

    async localizeDataSheetRowsArray<Page extends DataSheetPrototype.SomePageContent>(
        rowItems: DataSheetPrototype.RowItemContent<Page>[],
        schema: DataSheetRowLocalizationSchema<Page>
    ) {
        const arrayOfLocalizedRows = await rowItems
            .map(async (rowItem) => {
                return await this.localizeDataSheetRow(rowItem, schema)
            })
            .combinePromises()

        const localizedContentArraysByLanguage: Record<string, typeof rowItems> = {}
        const languages = Object.keys(arrayOfLocalizedRows[0])
        for (const language of languages) {
            localizedContentArraysByLanguage[language] = []
            for (const localizedRow of arrayOfLocalizedRows) {
                localizedContentArraysByLanguage[language].push(localizedRow[language])
            }
        }
        return localizedContentArraysByLanguage
    }

    async localizeDataSheetRow<Page extends DataSheetPrototype.SomePageContent>(
        rowItem: DataSheetPrototype.RowItemContent<Page>,
        schema: DataSheetRowLocalizationSchema<Page>
    ) {
        // Use for error messages only
        const rowItemJsonString = JSON.stringify(rowItem, null, 2)

        // Detect group name
        let groupName: string | undefined = undefined
        switch (schema.type) {
            case 'byItemId':
                groupName = schema.group
                break
            case 'byItemGroupAndKey':
                groupName = rowItem[schema.groupField] as string | undefined
                break
        }
        if (!groupName || groupName.isEmpty) {
            throw Error(
                `Can not detect localized group name\nData table row item: ${rowItemJsonString}`
            )
        }
        const localizedGroup = await this.findOneByGroupName(groupName)

        if (!localizedGroup) {
            throw Error(
                `Can not find localized group with name ${groupName}\nData table row item: ${rowItemJsonString}`
            )
        }

        const rowItemRecord = rowItem as Record<string, string>
        const resultItemForksByLanguage: Record<string, Record<string, string>> = {}
        localizedGroup.languages.forEach((language) => {
            resultItemForksByLanguage[language] = structuredClone(rowItem) as Record<string, string>
        })
        let itemId: string | undefined = undefined
        if (schema.type === 'byItemId') {
            itemId = rowItem[schema.itemIdField] as string
        }
        Object.keys(rowItem).forEach((propKey) => {
            // Do not try to localize empty cells
            if (rowItemRecord[propKey] === undefined) return

            // Prepare localization schema
            const propKeyForSchema = propKey as keyof typeof schema.localizationSchema
            const propSchema = schema.localizationSchema[propKeyForSchema]
            if (!propSchema) {
                throw Error(
                    `Can not find property localization schema for\nfield:\t'${propKey}'\ntable row item:\t${rowItemJsonString}`
                )
            }

            // Localize property
            switch (propSchema.type) {
                case 'originalContent':
                    return

                case 'byItemGroupAndKey': {
                    let keyValue = propKey
                    if (schema.type == 'byItemGroupAndKey') {
                        keyValue = rowItem[schema.keyField] as typeof keyValue
                    }
                    const fieldLocalizedString = localizedGroup.content[keyValue]
                    if (!fieldLocalizedString) {
                        throw Error(
                            `Can not find localized string with\ngroup:\t'${groupName}'\nkey:\t'${keyValue}'\nfor item:\t${rowItemJsonString}`
                        )
                    }
                    localizedGroup.languages.forEach((language) => {
                        resultItemForksByLanguage[language][propKey] =
                            fieldLocalizedString.localizedValues[language]
                    })
                    return
                }

                case 'byIdAndFieldName': {
                    if (!itemId) {
                        throw Error(
                            `Can not get id field content from data table row item:\t${rowItemJsonString}`
                        )
                    }
                    const localizedStringKeyBase = `${itemId} / ${propKey}`
                    const fieldLocalizedString = localizedGroup.content[localizedStringKeyBase]
                    if (!fieldLocalizedString) {
                        throw Error(
                            `Can not find localized string with\ngroup:\t'${groupName}'\nkey:\t'${localizedStringKeyBase}'\nfor item:\t${rowItemJsonString}`
                        )
                    }
                    localizedGroup.languages.forEach((language) => {
                        resultItemForksByLanguage[language][propKey] =
                            fieldLocalizedString.localizedValues[language]
                    })
                    return
                }

                case 'byIdAndFieldNameForArray': {
                    if (!itemId) {
                        throw Error(
                            `Can not get id field content from data table row item:\t${rowItemJsonString}`
                        )
                    }
                    const originalArrayFieldItemValue = rowItemRecord[propKey]
                    if (!originalArrayFieldItemValue) {
                        throw Error(
                            `Can not find field '${propKey}' inside data table row item:\t${rowItemJsonString}`
                        )
                    }

                    const fieldArrayItems = originalArrayFieldItemValue
                        .split(propSchema.itemsSeparator)
                        .map((arrayItem) => arrayItem.trimmed)
                        .filter((arrayItem) => arrayItem.isNotEmpty)
                        .map((arrayItem) => {
                            const arrayItemComponents = arrayItem
                                .split(propSchema.itemComponentsSeparator)
                                .map((fieldArrayItem) => fieldArrayItem.trimmed)
                            const arrayItemId = arrayItemComponents[propSchema.itemIdIndex]
                            if (!arrayItemId) {
                                throw Error(
                                    `Can not find item id inside string '${arrayItem}'\nfield:\t'${propKey}'\ntable row item:\t${rowItemJsonString}`
                                )
                            }
                            return {
                                id: arrayItemId.replace(propSchema.needToBeLocalizedPrefix, '')
                                    .trimmed,
                                needToBeLocalized: arrayItemId.startsWith(
                                    propSchema.needToBeLocalizedPrefix
                                ),
                                rawValue: arrayItem,
                            }
                        })

                    if (fieldArrayItems.isEmpty) {
                        throw Error(
                            `Can not find array items inside string '${originalArrayFieldItemValue}'\ntable row item:\t${rowItemJsonString}`
                        )
                    }

                    const duplicatedarrayItemIds = fieldArrayItems.map(
                        (fieldArrayItem) => fieldArrayItem.id
                    ).justNotUnique
                    if (duplicatedarrayItemIds.isNotEmpty)
                        throw Error(
                            `Duplicated id\nfield:\t'${propKey}'\ntable row item:\t${rowItemJsonString}`
                        )

                    const arrayItemsLocalizedStrings = fieldArrayItems.map((arrayItem) => {
                        if (arrayItem.needToBeLocalized === false) return undefined

                        const localizedStringKey = `${itemId} / ${propKey} / ${arrayItem.id}`
                        const fieldLocalizedString = localizedGroup.content[localizedStringKey]
                        if (!fieldLocalizedString) {
                            throw Error(
                                `Can not find localized string with\ngroup:\t'${groupName}'\nkey:\t'${localizedStringKey}'\nfor item:\t${rowItemJsonString}`
                            )
                        }
                        return fieldLocalizedString
                    })

                    localizedGroup.languages.forEach((language) => {
                        const localizedFieldValue = fieldArrayItems
                            .map((fieldArrayItem, index) => {
                                const localizedString = arrayItemsLocalizedStrings[index]

                                if (!localizedString) return fieldArrayItem.rawValue
                                // TODO: use propSchema.arrayItemIdIndex while combine array items
                                // If format is not `${id}${separator}${value}`
                                return [
                                    `${fieldArrayItem.id}`,
                                    `${localizedString.localizedValues[language]}`,
                                ].join(propSchema.itemComponentsSeparator)
                            })
                            .join(propSchema.itemsSeparator)

                        resultItemForksByLanguage[language][propKey] = localizedFieldValue
                    })
                    return
                }
            }
        })

        return resultItemForksByLanguage as Record<string, typeof rowItem>
    }

    // =====================
    // Private methods
    // =====================

    private async getRemoteLanguages(): Promise<LanguageCode.Union[]> {
        if (DataSheetPrototype.allPagesLocalization.isEmpty) {
            throw Error(`Fail to get languages: there is no localization pages`)
        }

        const languagesForAllPages = await DataSheetPrototype.allPagesLocalization
            .map(async (page) => {
                const languages = await this.sheetDataProvider.getLanguagesFrom(page)
                if (!languages || languages.isEmpty) {
                    throw Error(`Fail to get languages: fail to get languages from page ${page}`)
                }
                return {
                    page: page,
                    languages: languages.uniqueOnly,
                }
            })
            .combinePromises()

        const languagesSetDefault = languagesForAllPages[0].languages.toSorted()
        const languagesSetDefaultString = languagesForAllPages[0].languages.toSorted().join(', ')
        for (const languagesSet of languagesForAllPages) {
            const languagesSetString = languagesSet.languages.toSorted().join(', ')
            if (languagesSetString == languagesSetDefaultString) continue

            const contentJsonString = JSON.stringify(languagesForAllPages)
            throw Error(
                `Fail to get languages: localization pages have different languages set\nContent:\t${contentJsonString}`
            )
        }
        return languagesSetDefault
    }

    private async cacheLocalizationRowsCommonArray() {
        const localizationContent = await DataSheetPrototype.allPagesLocalization
            .map(async (page) => {
                const pageContent = await this.sheetDataProvider.getLocalizedStringsFrom(page)
                if (!pageContent || pageContent.isEmpty) {
                    throw Error(`Fail to get table content from page ${page}`)
                }
                return pageContent
            })
            .combinePromises()

        return localizationContent.flat()
    }

    // =====================
    // Private methods:
    // Database
    // =====================

    private async createOrUpdate(
        createLocalizedGroupDto: LocalizedGroupDto
    ): Promise<LocalizedGroup | unknown> {
        await this.model.deleteOne({ name: createLocalizedGroupDto.name }).exec()
        return await this.model.create(createLocalizedGroupDto)
    }
}

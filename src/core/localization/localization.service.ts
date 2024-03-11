import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LocalizedGroup } from './schemas/localization.schema'
import { Model } from 'mongoose'
import { LocalizedGroupDto } from './dto/localized-group.dto'
import { LocalizedString } from './schemas/models/localization.localized-string'
import { logger } from 'src/app.logger'
import { SheetDataProviderService } from '../sheet-data-provider/sheet-data-provider.service'

@Injectable()
export class LocalizationService {
    // Spreadsheet cache constants
    private readonly cachedTrueValue = 'TRUE'

    constructor(
        @InjectModel(LocalizedGroup.name) private model: Model<LocalizedGroup>,
        private readonly sheetDataProvider: SheetDataProviderService
    ) {}

    // =====================
    // Public methods
    // =====================

    async findOneByGroupName(groupName: string): Promise<LocalizedGroup | null> {
        return this.model.findOne({ name: groupName }).exec()
    }

    async getRemoteLanguages(): Promise<string[]> {
        const languages = await this.sheetDataProvider.getLanguagesFrom('uniqueMessages')
        if (!languages || languages.isEmpty) {
            throw Error('No languages content')
        }
        return languages
    }

    async cacheLocalization() {
        const languages = await this.getRemoteLanguages()

        logger.log(`\nLanguages: ${languages}`)

        // Get localization content
        const content = await this.sheetDataProvider.getLocalizedStringsFrom('uniqueMessages')
        if (!content) {
            throw Error('No languages content')
        }

        const localizedStrings: LocalizedString[] = content.map((row) => {
            const localizedString: LocalizedString = {
                groupName: row.group.lowerCasedFirstCharOnly,
                key: row.key.lowerCasedFirstCharOnly,
                comment: row.comment,
                parameters: [],
                isUniqueMessage: row.isUniqueMessage == this.cachedTrueValue,
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
                content: localizedStrings
                    .filter((value) => value.groupName == groupName)
                    .generateItemsRecord((localizedString) => localizedString.key),
            })
        }
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

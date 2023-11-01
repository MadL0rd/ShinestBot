import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LocalizedGroup } from './schemas/localization.schema'
import { Model } from 'mongoose'
import { GoogleTablesService } from '../google-tables/google-tables.service'
import { LocalizedGroupDto } from './dto/localized-group.dto'
import { PageNameEnum } from '../google-tables/enums/page-name.enum'
import { LocalizedString } from './schemas/models/localization.localized-string'
import { logger } from 'src/app.logger'

@Injectable()
export class LocalizationService implements OnModuleInit {
    // Spreadsheet cache constants
    private readonly cachedTrueValue = 'TRUE'
    private readonly languagesStartSheetLetter = 'F'
    private readonly languagesStartSheetLetterIndex = this.languagesStartSheetLetter.charCodeAt(0)
    private readonly firstLetter = 'A'
    private readonly firstLetterIndex = this.firstLetter.charCodeAt(0)
    private readonly lastLetter = 'Z'
    private readonly configurationRowIndex = 5 //  Starts from 1
    private readonly startSheetLocalizationRowsIndex = 6
    private readonly endSheetLocalizationRowsIndex = 1000

    constructor(
        @InjectModel(LocalizedGroup.name) private model: Model<LocalizedGroup>,
        private readonly googleTablesService: GoogleTablesService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.cacheLocalization()
    }

    // =====================
    // Public methods
    // =====================

    async findOneByGroupName(groupName: string): Promise<LocalizedGroup> {
        return this.model.findOne({ name: groupName }).exec()
    }

    async getRemoteLanguages(): Promise<string[]> {
        const contentLanguages = await this.googleTablesService.getContentByListName(
            PageNameEnum.uniqueMessages,
            `${this.languagesStartSheetLetter}${this.configurationRowIndex}:${this.lastLetter}${this.configurationRowIndex}`
        )
        if (!contentLanguages) {
            throw Error('No languages content')
        }
        const languages = contentLanguages[0]
        return languages
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

    // =====================
    // Private methods:
    // Google spreadsheets
    // =====================

    private async cacheLocalization() {
        const languages = await this.getRemoteLanguages()
        const rowEstimatedLength =
            this.languagesStartSheetLetterIndex - this.firstLetterIndex + languages.length

        logger.log(`Languages: ${languages}`)
        logger.log(`Estimated row length: ${rowEstimatedLength}`)

        // Get localization content
        const languagesLastLetter = String.fromCharCode(
            this.languagesStartSheetLetterIndex + languages.length
        )
        const content = await this.googleTablesService.getContentByListName(
            PageNameEnum.uniqueMessages,
            `${this.firstLetter}${this.startSheetLocalizationRowsIndex}:${languagesLastLetter}${this.endSheetLocalizationRowsIndex}`
        )
        if (!content) {
            throw Error('No languages content')
        }

        const localizedStrings: LocalizedString[] = []
        for (const row of content) {
            if (row.length != rowEstimatedLength) continue

            const localizedValues = row.slice(rowEstimatedLength - languages.length)
            const localizedValuesDict: Record<string, string> = {}
            localizedValues.forEach((value, index) => {
                localizedValuesDict[languages[index]] = value
            })

            localizedStrings.push({
                groupName: row[0].lowerCasedFirstCharOnly,
                key: row[1].lowerCasedFirstCharOnly,
                comment: row[2],
                parameters: [], // TODO: add parameters
                isUniqueMessage: row[3] == this.cachedTrueValue,
                localizedValues: localizedValuesDict,
            })
        }
        await this.model.deleteMany({})

        // Create and save localized groups
        const groupNames: string[] = localizedStrings.map((value) => value.groupName).uniqueOnly
        for (const groupName of groupNames) {
            await this.createOrUpdate({
                name: groupName,
                content: localizedStrings.filter((value) => value.groupName == groupName),
            })
        }
    }
}
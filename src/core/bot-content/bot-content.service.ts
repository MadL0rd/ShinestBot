import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
    BotContent,
    BotContentDocument,
    BotContentStable,
    OnboardingPage,
    UniqueMessage,
} from './schemas/bot-content.schema'
import { LanguageSupportedKey } from './language-supported-key.enum'
import { GoogleTablesService } from '../google-tables/google-tables.service'
import { PageNameEnum } from '../google-tables/enums/page-name.enum'
import { CreateBotContentDto } from './dto/create-bot-content.dto'
import { UpdateBotContentDto } from './dto/update-bot-content.dto'

@Injectable()
export class BotContentService implements OnModuleInit {
    // =====================
    // Initializer
    // =====================

    constructor(
        @InjectModel(BotContent.name) private botContentModel: Model<BotContent>,
        private readonly googleTablesService: GoogleTablesService
    ) {}

    async onModuleInit(): Promise<void> {
        for (const language in LanguageSupportedKey) {
            for (const pageName in PageNameEnum) {
                await this.cacheSpreadsheetPage(PageNameEnum[pageName], LanguageSupportedKey[language])
            }
        }
    }

    // =====================
    // Public methods
    // =====================

    async getContent(lang: LanguageSupportedKey): Promise<BotContentStable> {
        return this.findOneBy(lang) as Promise<BotContentStable>
    }

    async cacheSpreadsheetPage(pageName: PageNameEnum, language: LanguageSupportedKey): Promise<BotContent> {
        switch (pageName) {
            case PageNameEnum.uniqueMessages:
                return this.cacheUniqueMessage(LanguageSupportedKey[language])

            case PageNameEnum.onboarding:
                return this.cacheOnboarding(LanguageSupportedKey[language])
        }
    }

    // =====================
    // Private methods:
    // Database
    // =====================

    private async create(createBotContentDto: CreateBotContentDto): Promise<BotContent> {
        return this.botContentModel.create(createBotContentDto)
    }

    private async update(
        updateBotContentDto: UpdateBotContentDto,
        existingContent: BotContentDocument //BotContent
    ): Promise<any> {
        return this.botContentModel
            .updateOne({ _id: existingContent._id }, updateBotContentDto, { new: true })
            .exec()
    }

    private async findOneBy(lang: LanguageSupportedKey): Promise<BotContent> {
        return this.botContentModel.findOne({ lang: lang }).exec()
    }

    // =====================
    // Private methods:
    // Google spreadsheets
    // =====================

    private async cacheUniqueMessage(lang: LanguageSupportedKey): Promise<BotContent> {
        const createBotContentDto: CreateBotContentDto = { lang: lang }
        const content = await this.googleTablesService.getContentByListName(
            PageNameEnum.uniqueMessages,
            'A2:B150'
        )
        if (!content) {
            throw Error('No content')
        }

        createBotContentDto.uniqueMessage = this.createUniqueMessageObj(content)

        const existingContent = await this.botContentModel
            .findOne({ lang: createBotContentDto.lang })
            .exec()
        if (existingContent && !existingContent.isNew) {
            return this.update(createBotContentDto, existingContent)
        }

        return this.create(createBotContentDto)
    }

    /** Преобразоание массива ячеек в обьект уникальных сообщений */
    private createUniqueMessageObj(googleRows: any): UniqueMessage {
        const uniqueMessageObj = {}
        for (const element of googleRows) {
            if (element.length < 1) {
                continue
            }
            uniqueMessageObj[element[0]] = element[1]
        }
        return uniqueMessageObj
    }

    private async cacheOnboarding(lang: LanguageSupportedKey): Promise<BotContent> {
        const createBotContentDto: CreateBotContentDto = { lang: lang }
        const content = await this.googleTablesService.getContentByListName(
            PageNameEnum.onboarding,
            'A2:C50'
        )
        if (!content) {
            throw Error('No content')
        }

        createBotContentDto.onboarding = this.createOnboardingArray(content)

        const existingContent = await this.botContentModel
            .findOne({ lang: createBotContentDto.lang })
            .exec()
        if (existingContent && !existingContent.isNew) {
            return this.update(createBotContentDto, existingContent)
        }

        return this.create(createBotContentDto)
    }

    /** Преобразоание массива ячеек в массив обьектов онборбинга */
    private createOnboardingArray(googleRows: any): [OnboardingPage] {
        let onbordingArray: [OnboardingPage]
        for (const element of googleRows) {
            if (element.length < 1) {
                continue
            }
            if (!onbordingArray) {
                onbordingArray = [
                    {
                        id: element[0],
                        messageText: element[1],
                        buttonText: element[2],
                    },
                ]
                continue
            }
            const onboardinjObj: OnboardingPage = {
                id: element[0],
                messageText: element[1],
                buttonText: element[2],
            }
            onbordingArray.push(onboardinjObj)
        }
        return onbordingArray
    }
}

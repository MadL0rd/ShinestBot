import { Injectable } from '@nestjs/common'
import { SurveyProviderDefaultService } from '../providers/survey-provider-default.service'
import {
    ISurveyDataProvider,
    SurveyDataProviderType,
} from '../models/survey-data-provider.interface'

@Injectable()
export class SurveyDataProviderFactoryService {
    constructor(private readonly providerDefault: SurveyProviderDefaultService) {}

    getSurveyProvider(type: SurveyDataProviderType): ISurveyDataProvider {
        switch (type) {
            case 'default':
                return this.providerDefault
        }
    }
}

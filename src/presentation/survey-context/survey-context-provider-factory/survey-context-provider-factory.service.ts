import { Injectable } from '@nestjs/common'
import { SurveyContextDefaultService } from '../context-providers/survey-context-provider-default.service'
import {
    ISurveyContextProvider,
    SurveyContextProviderType,
} from '../abstract/survey-context-provider.interface'

@Injectable()
export class SurveyContextProviderFactoryService {
    constructor(private readonly providerDefault: SurveyContextDefaultService) {}

    getSurveyContextProvider(type: SurveyContextProviderType.Union): ISurveyContextProvider {
        switch (type) {
            case 'default':
                return this.providerDefault
        }
    }
}

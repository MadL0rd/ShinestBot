import { Injectable } from '@nestjs/common'
import {
    ISurveyContextProvider,
    SurveyContextProviderType,
} from '../abstract/survey-context-provider.interface'
import { SurveyContextRegistrationService } from '../context-providers/survey-context-provider-registration.service'

@Injectable()
export class SurveyContextProviderFactoryService {
    constructor(private readonly providerDefault: SurveyContextRegistrationService) {}

    getSurveyContextProvider(type: SurveyContextProviderType.Union): ISurveyContextProvider {
        switch (type) {
            case 'registration':
                return this.providerDefault
        }
    }
}

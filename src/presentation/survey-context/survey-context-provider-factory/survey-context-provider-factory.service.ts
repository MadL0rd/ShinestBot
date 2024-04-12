import { Injectable } from '@nestjs/common'
import { SurveyContextDefaultService } from '../context-providers/survey-context-provider-default.service'
import {
    ISurveyContextProvider,
    SurveyContextProviderType,
} from '../abstract/survey-context-provider.interface'
import { SurveyContextModerationEditingService } from '../context-providers/survey-context-provider-moderation-editing'

@Injectable()
export class SurveyContextProviderFactoryService {
    constructor(
        private readonly providerDefault: SurveyContextDefaultService,
        private readonly moderationEditing: SurveyContextModerationEditingService
    ) {}

    getSurveyContextProvider(type: SurveyContextProviderType.Union): ISurveyContextProvider {
        switch (type) {
            case 'default':
                return this.providerDefault
            case 'moderationEditing': {
                return this.moderationEditing
            }
        }
    }
}

import { Injectable } from '@nestjs/common'
import { UserService } from 'src/business-logic/user/user.service'
import { InjectBot } from 'nestjs-telegraf'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { Telegraf } from 'telegraf'
import { logger } from 'src/app/app.logger'
import { StatisticService } from 'src/business-logic/user/statistic.service'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { PublicationStorageService } from 'src/business-logic/publication-storage/publication-storage.service'
import { ModeratedPublicationsService } from 'src/presentation/publication-management/moderated-publications/moderated-publications.service'
import { GptApiService } from 'src/business-logic/gpt-api/gpt-api.service'
import { YandexSpeechKitService } from 'src/business-logic/yandex-speech-kit/yandex-speech-kit.service'

interface Type<T> {
    new (...args: any[]): T
}

/**
 * Decorator that makes class constructor injectable
 *
 * All scene dependencies must be provided inside `SceneInjectionsProvider`
 */
export function InjectableSceneConstructor() {
    return function <T>(target: Type<T>) {
        // Result does not need to be used
        // But line below provides access to type reflection
        Reflect.getMetadata('design:paramtypes', target)
    }
}

@Injectable()
export class SceneInjectionsProviderService {
    private registry: Map<string, any> = new Map()

    constructor(
        @InjectBot() private readonly bot: Telegraf,
        protected readonly userService: UserService,
        protected readonly botContentService: BotContentService,
        protected readonly surveyContextProviderFactory: SurveyContextProviderFactoryService,
        protected readonly statisticService: StatisticService,
        protected readonly publicationStorageService: PublicationStorageService,
        protected readonly moderatedPublicationService: ModeratedPublicationsService,
        protected readonly gptService: GptApiService,
        protected readonly yandexSpeechKit: YandexSpeechKitService
    ) {
        const propertyNames = Object.keys(this).filter((prop) => prop != 'registry')
        const tokens =
            Reflect.getMetadata('design:paramtypes', SceneInjectionsProviderService) ?? []

        if (propertyNames.length != tokens.length) {
            throw Error('SceneInjectionsProvider registry creation error')
        }

        propertyNames.forEach((propName, index) => {
            this.register(tokens[index].name, (this as any)[propName])
        })
    }

    private register(key: string, instance: any) {
        if (this.registry.has(key)) {
            throw Error(
                `SceneInjectionsProvider registration error: key '${key}' already registered`
            )
        }

        this.registry.set(key, instance)
        logger.log(`Added ${key} to the scene registry.`)
    }

    resolve<T>(target: Type<T>): T {
        const tokens = Reflect.getMetadata('design:paramtypes', target) || []
        const injections = []
        for (const token of tokens) {
            const dependencyInstance = this.registry.get(token.name)
            if (!dependencyInstance)
                throw Error(
                    `Fail to inject class ${token.name}\nYou can check imports in ./src/scenes/scene.module.ts and constructor args of SceneInjectionsProviderService`
                )
            injections.push(dependencyInstance)
        }
        const instance = new target(...injections)
        return instance
    }
}

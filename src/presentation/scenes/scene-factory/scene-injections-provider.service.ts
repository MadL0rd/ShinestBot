import { Injectable } from '@nestjs/common'
import { logger } from 'src/app/app.logger'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { MailingMessagesRepository } from 'src/business-logic/mailing/mailing-messages.repo'
import { MailingService } from 'src/business-logic/mailing/mailing.service'
import { StatisticService } from 'src/business-logic/user/statistic.service'
import { UserService } from 'src/business-logic/user/user.service'
import { YandexSpeechKitService } from 'src/business-logic/yandex-speech-kit/yandex-speech-kit.service'
import { SurveyContextProviderFactoryService } from 'src/presentation/survey-context/survey-context-provider-factory/survey-context-provider-factory.service'
import { UserBuilderService } from 'src/presentation/user-adapter/user-builder/user-builder.service'
import { UserSupportService } from 'src/presentation/user-adapter/user-support/user-support.service'

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
        protected readonly userService: UserService,
        protected readonly botContentService: BotContentService,
        protected readonly surveyContextProviderFactory: SurveyContextProviderFactoryService,
        protected readonly statisticService: StatisticService,
        protected readonly yandexSpeechKit: YandexSpeechKitService,
        protected readonly userSupport: UserSupportService,
        protected readonly userBuilderService: UserBuilderService,
        protected readonly mailingService: MailingService,
        protected readonly chainTasksService: ChainTasksService,
        protected readonly mailingMessagesRepo: MailingMessagesRepository
    ) {
        const propertyNames = Object.keys(this).filter((prop) => prop !== 'registry')
        const tokens =
            Reflect.getMetadata('design:paramtypes', SceneInjectionsProviderService) ?? []

        if (propertyNames.length != tokens.length) {
            throw Error('SceneInjectionsProvider registry creation error')
        }

        propertyNames.forEach((propName, index) => {
            this.register(tokens[index].name, this[propName as keyof this])
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

import { Injectable } from '@nestjs/common'
import { UserService } from 'src/business-logic/user/user.service'
import { InjectBot } from 'nestjs-telegraf'
import { BotContentService } from 'src/business-logic/bot-content/bot-content.service'
import { LocalizationService } from 'src/core/localization/localization.service'
import { Telegraf } from 'telegraf'
import { logger } from 'src/app/app.logger'
import { StatisticService } from 'src/business-logic/user/statistic.service'

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
        protected readonly localizationService: LocalizationService,
        protected readonly statisticService: StatisticService,
        @InjectBot() private readonly bot: Telegraf
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
        if (!this.registry.has(key)) {
            this.registry.set(key, instance)
            console.log(`Added ${key} to the registry.`)
        }
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

import { logger } from 'src/app/app.logger'
process.on('uncaughtException', (error) => {
    logger.error(`THERE WAS AN UNCAUGHT EXCEPTION`, error)
})

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import { internalConstants } from './app/app.internal-constants'
import { AppModule } from './app/app.module'
import { ExtensionsModule } from './extensions/extensions.module'

async function bootstrap() {
    ExtensionsModule.initExtensions()

    const app = await NestFactory.create(AppModule, {
        logger: logger,
    })

    logger.log(internalConstants)

    if (internalConstants.webhookAndPorts.enableInternalCors) {
        app.enableCors()
        logger.log(`ENABLE CORS`)
    }

    const appPort = internalConstants.webhookAndPorts.exposePort ?? 3000
    app.useGlobalPipes(new ValidationPipe())
    app.use(json({ limit: '50mb' }))
    app.use(urlencoded({ extended: true, limit: '50mb' }))
    await app.listen(appPort)

    logger.log(`http://localhost:${appPort}/`)
}
bootstrap().then()

/* eslint-disable @typescript-eslint/no-var-requires */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { logger } from 'src/app.logger'
import { internalConstants } from './app.internal-constants'
import { ExtensionsModule } from './extensions/extensions.module'

async function bootstrap() {
    const extensions = new ExtensionsModule()
    extensions.initExtensions()
    const app = await NestFactory.create(AppModule, {
        logger: logger,
    })

    logger.log(`Internal constants:\n${JSON.stringify(internalConstants, null, 2)}`)

    if (internalConstants.enableInternalCors) {
        app.enableCors()
        logger.log(`ENABLE CORS`)
    }

    const appPort = Number(internalConstants.appPorts.split(':').last) ?? 3000
    await app.listen(appPort)

    logger.log(`http://localhost:${appPort}/`)
}
bootstrap().then()

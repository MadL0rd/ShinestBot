import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { transports } from 'winston'
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import * as path from 'path'
import { logger } from './app.logger'
import { internalConstants } from './app.internal-constants'
import { ExtensionsModule } from './extensions/extensions.module'

async function bootstrap() {
    const extensions = new ExtensionsModule()
    extensions.initExtensions()

    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            transports: [
                // logging all level
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        nestWinstonModuleUtilities.format.nestLike()
                    ),
                    handleExceptions: true,
                }),
                new winston.transports.File({
                    level: 'info',
                    filename: path.join(process.cwd(), '/logs/', 'logs.log'),
                    handleExceptions: true,
                }),
                new winston.transports.File({
                    level: 'error',
                    filename: path.join(process.cwd(), '/logs/', 'errors.log'),
                }),
            ],
            exceptionHandlers: [
                new transports.File({
                    filename: path.join(process.cwd(), '/logs/', 'exceptions.log'),
                }),
            ],
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD/MM/YYYY, HH:mm:ss',
                }),
                winston.format.printf(
                    (error) =>
                        `[Nest] 5277   - ${[error.timestamp]}  [${error.context}] :  ${
                            error.level
                        }: ${error.message}`
                )
            ),
        }),
    })

    // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))

    logger.log(`Internal constants:\n${JSON.stringify(internalConstants, null, 2)}`)

    if (internalConstants.enableInternalCors == true) {
        app.enableCors()
        logger.log(`ENABLE CORS`)
    }

    await app.listen(3000)
    logger.log(`http://localhost:3000/`)
}
bootstrap().then()

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { format, transports } from 'winston'
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import * as path from 'path'

async function bootstrap() {
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
    //app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
    await app.listen(3000)
}
bootstrap().then()

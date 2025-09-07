import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { logger } from 'src/app/app.logger'

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
    use(request: Request, response: Response, next: NextFunction): void {
        const requestInfo = {
            ip: request.ip,
            userAgent: request.get('user-agent'),
            url: request.originalUrl,
            method: request.method,
            headers: request.headers,
            body: request.body,
        }

        response.on('close', () => {
            logger.log(
                `Incoming request:\n${JSON.stringify({ request: requestInfo, response: { statusCode: response.statusCode } })}`
            )
        })

        next()
    }
}

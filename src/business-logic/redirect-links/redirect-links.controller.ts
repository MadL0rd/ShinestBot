import {
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Query,
    Redirect,
    Req,
} from '@nestjs/common'
import { Request } from 'express'
import { logger } from 'src/app/app.logger'
import { BotContent } from 'src/entities/bot-content'
import { ExceptionGuard } from 'src/exceptions-and-logging/exception-guard.decorator'
import { BotContentService } from '../bot-content/bot-content.service'
import { ChainTasksService } from '../chain-tasks/chain-tasks.service'
import { UserService } from '../user/user.service'

@Controller('redirect')
export class RedirectLinksController {
    constructor(
        private readonly botContentService: BotContentService,
        private readonly chainTasksService: ChainTasksService,
        private readonly userService: UserService
    ) {}

    @Get('link/:alias')
    @Redirect()
    async redirectTo(
        @Req() request: Request,
        @Param('alias') alias: string,
        @Query('telegramId', new ParseIntPipe({ optional: true })) telegramId?: number
    ) {
        const content = await this.botContentService.getContent()
        const redirectLink = content.redirectLinks.find((link) => link.id === alias)
        if (!redirectLink) throw new NotFoundException()
        if (!request.headers['user-agent']?.startsWith('TelegramBot')) {
            this.saveRedirectInfoToStatistic({
                redirectLink: redirectLink,
                telegramId: telegramId ?? null,
                alias: alias,
                request: request,
            })
        }

        return { url: redirectLink.source }
    }

    @ExceptionGuard()
    private async saveRedirectInfoToStatistic(args: {
        redirectLink: BotContent.RedirectLinks.BaseType
        telegramId: number | null
        alias: string
        request: Request
    }) {
        const { redirectLink, telegramId, alias, request } = args
        if (!telegramId) {
            logger.warn(
                `Redirect request from ${request.url} to ${redirectLink.source}. But cannot find telegramId in request`
            )
            return
        }
        const userExists = await this.userService.exists(telegramId)
        if (!userExists) {
            logger.log(
                `Redirect request from ${request.url} to ${redirectLink.source}. But cannot find user with telegramId ${telegramId}`
            )
            return
        }

        logger.log(
            `Redirect request from ${request.url} to ${redirectLink.source} for user with telegramId ${telegramId}`
        )
        await this.chainTasksService.addTask({
            userTelegramId: telegramId,
            action: {
                resourceType: 'telegram',
                actionType: 'sendMessage',
                dialogType: 'topicDefault',
                data: {
                    type: 'text',
                    text: `Пользователь перешёл по редирект-ссылке и был перенаправлен на ${redirectLink.source}`,
                },
            },
        })

        await this.userService.logToUserHistory(
            { telegramId },
            {
                type: 'redirectLink',
                alias: alias,
                redirectUrl: redirectLink.source,
                utm: Object.keys(request.query)
                    .filter((param) => param.toLowerCase().startsWith('utm_'))
                    .reduce(
                        (acc, param) => {
                            acc[param] = `${request.query[param]}`
                            return acc
                        },
                        {} as Record<string, string>
                    ),
            }
        )
    }
}

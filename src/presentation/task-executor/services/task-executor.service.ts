import { Injectable, OnModuleInit } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { logger } from 'src/app/app.logger'
import { ChainTasksService } from 'src/business-logic/chain-tasks/chain-tasks.service'
import { ChainTaskDocument } from 'src/business-logic/chain-tasks/schemas/chain-tasks-schema'
import { UserService } from 'src/business-logic/user/user.service'
import { ExceptionGuard } from 'src/exceptions-and-logging/exception-guard.decorator'
import { getSendMessageErrorType } from 'src/presentation/utils/get-send-message-error-type.utils'
import { ConcurrencyError, LockAsyncWithSharedMutex } from 'src/utils/decorators/lock-async'
import { sleep } from 'src/utils/sleep'
import { TaskExecutorTelegramService } from './task-executor-telegram.service'

@Injectable()
export class TaskExecutorService implements OnModuleInit {
    constructor(
        private readonly chainTasksService: ChainTasksService,
        private readonly telegramTasksExecutor: TaskExecutorTelegramService,
        private readonly userService: UserService
    ) {}

    onModuleInit() {
        this.checkTasksQueue()
    }

    @OnEvent('chainTask.created')
    @ExceptionGuard()
    private async onChainTaskCreate(args: { userTelegramId: number }) {
        const info = await this.chainTasksService.getUserTasksQueueInfo(args.userTelegramId)
        if (info.count === 0) await sleep(3)
        this.executeChainTasksForUser(args.userTelegramId)
    }

    @Cron(CronExpression.EVERY_HOUR)
    @OnEvent('chainTask.configUpdated')
    @ExceptionGuard()
    private async checkTasksQueue() {
        const thereIsAtLeastOnePendingTask =
            await this.chainTasksService.checkThereIsAtLeastOnePendingTask()
        if (!thereIsAtLeastOnePendingTask) return

        const userTelegramIds = await this.chainTasksService.getActivePendingTasksUserTelegramIds()
        if (userTelegramIds.isEmpty) return

        logger.log(`Pending users with tasks count: ${userTelegramIds.length}`)

        for (const userTelegramId of userTelegramIds) {
            this.executeChainTasksForUser(userTelegramId)
        }
    }

    @ExceptionGuard({
        checkErrorShouldBeLogged: (error) => !(error instanceof ConcurrencyError),
    })
    @LockAsyncWithSharedMutex({
        concurrencyStrategy: { type: 'semaphoreLikeReject', maxConsumersCount: 2 },
        generateMutexId: (args): string => {
            return `${args}-chain-task-group-execution`
        },
    })
    private async executeChainTasksForUser(userTelegramId: number) {
        const tasks = await this.chainTasksService.getActivePendingTasksForUser(userTelegramId)
        if (tasks.isEmpty) return

        for (const task of tasks) {
            const success = await this.executeTask(task)
            if (!success) {
                logger.error(
                    `User tasks queue issued: ${task.userTelegramId}\n${JSON.stringify(task.action)}`
                )
                await this.chainTasksService.setUserTasksStateIssued(task.userTelegramId)
                return
            } else {
                await this.chainTasksService.deleteById(task._id.toString())
            }
        }
    }

    private async executeTask(task: ChainTaskDocument): Promise<boolean> {
        let success = false
        let errorCache: unknown

        logger.log(`Start execute task: ${JSON.stringify(task)}`)

        const user = await this.userService.findOneByTelegramId(task.userTelegramId)
        if (!user) return false

        const action = task.action
        switch (action.resourceType) {
            case 'telegram': {
                const maxRetryCount = 3
                for (let i = 0; i < maxRetryCount; i++) {
                    try {
                        success = await this.telegramTasksExecutor[action.actionType](
                            user,
                            task.action as any
                        )
                    } catch (error) {
                        errorCache = error
                        logger.warn(`Fail to complete telegram task ${JSON.stringify(task)}`)
                        logger.warn(error)
                        const parsedError = getSendMessageErrorType(error)
                        switch (parsedError.type) {
                            case undefined:
                                break
                            case 'tooManyRequests': {
                                let timeout = parsedError.timeoutSec
                                if (timeout > 60 * 30) {
                                    logger.warn(
                                        `Detected Telegram chain task huge timeout\n${JSON.stringify(task)}`
                                    )
                                    timeout = 60 * 10
                                }
                                await sleep(timeout)
                                break
                            }

                            case 'botWasBlockedByUser':
                            case 'messageThreadNotFound':
                            case 'messageIsNotModified':
                            case 'userIsDeactivated':
                                success = true
                                break

                            case 'messageToForwardNotFound':
                                logger.warn(
                                    `Fail to forward message from task: ${JSON.stringify(task)}`,
                                    error
                                )
                                success = true
                                break
                        }
                    }
                    if (success) break
                    await sleep(3)
                }
                break
            }
        }

        if (!success) {
            logger.error(`Fail to complete telegram task ${JSON.stringify(task)}`, errorCache)
        }
        return success
    }
}

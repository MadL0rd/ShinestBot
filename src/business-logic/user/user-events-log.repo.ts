import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { logger } from 'src/app/app.logger'
import { MongooseMigrations } from 'src/core/mongoose-migration-assistant/mongoose-migrations'
import { objectToMongooseFilter } from 'src/utils/object-to-mongoose-filter'
import { AggregationResultItem } from './dto/aggregation-result-item.dto'
import { EventFilter } from './dto/event-statistic-column.dto'
import { UserHistoryEvent } from './enums/user-history-event.enum'
import {
    UserEventsLogDocument,
    UserEventsLogSchema,
    userEventsLogVersionSchema,
} from './schemas/user-events-log.schema'

@Injectable()
export class UserEventsLogRepository implements OnModuleInit {
    constructor(
        @InjectModel(UserEventsLogSchema.name)
        private model: Model<UserEventsLogDocument>
    ) {}

    async onModuleInit() {
        await this.runMigrations()
    }

    async logUserEvent<EventName extends UserHistoryEvent.EventTypeName>(
        user: { telegramId: number },
        event: UserHistoryEvent.SomeEventType<EventName>
    ): Promise<void> {
        await this.model.create({
            telegramId: user.telegramId,
            date: new Date(),
            type: event.type,
            eventData: event,
        })
    }

    async aggregateEventStatisticByDates<EventName extends UserHistoryEvent.EventTypeName>(args: {
        dateStart: Date
        dateEnd: Date
        eventFilter: EventFilter<EventName>
    }): Promise<Map<string, AggregationResultItem>> {
        const { dateStart, dateEnd } = args
        const { type: eventType, ...eventDataFilter } = args.eventFilter

        const eventFilter = objectToMongooseFilter({ eventData: eventDataFilter })

        const statisticDayItems = await this.model.aggregate([
            // 1. Отфильтровать по типу и дате
            {
                $match: Object.keys(eventDataFilter).isNotEmpty
                    ? {
                          type: eventType,
                          date: {
                              $gte: dateStart,
                              $lt: dateEnd,
                          },
                          ...eventFilter,
                      }
                    : {
                          type: eventType,
                          date: {
                              $gte: dateStart,
                              $lt: dateEnd,
                          },
                      },
            },

            // 2. Сгруппировать по дате (МСК) и пользователю
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$date',
                                timezone: '+03:00',
                            },
                        },
                        telegramId: '$telegramId',
                    },
                    count: { $sum: 1 },
                },
            },

            // 3. Сгруппировать по дате, посчитать сумму и уникальных
            {
                $group: {
                    _id: '$_id.date',
                    totalEvents: { $sum: '$count' },
                    uniqueUsers: { $sum: 1 },
                },
            },

            // 4. Переименовать _id → date
            {
                $project: {
                    dateString: '$_id',
                    totalEvents: 1,
                    uniqueUsers: 1,
                    _id: 0,
                },
            },

            // 5. Отсортировать по убыванию даты
            { $sort: { dateString: -1 } },
        ])

        return statisticDayItems.reduce(
            (acc, statisticDayItem) => {
                acc.set(statisticDayItem.dateString, statisticDayItem)
                return acc
            },
            new Map() as Map<string, AggregationResultItem>
        )
    }

    private async runMigrations() {
        const assistant = new MongooseMigrations.Assistant({
            model: this.model,
            documentVersionKey: 'migrationsVersion',
            currentVersion: userEventsLogVersionSchema.currentVersion,
            legacyVersions: userEventsLogVersionSchema.legacyVersions,
            migrationsConfiguration: {},
            logger: logger,
        })
        await assistant.runMigrations()
    }
}

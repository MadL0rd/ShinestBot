import moment, { Moment } from 'moment'
import { internalConstants } from 'src/app/app.internal-constants'

type TimeUnit =
    | 'years'
    | 'months'
    | 'weeks'
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'milliseconds'

declare global {
    interface Date {
        formattedWithAppTimeZone(dateFormat?: string): string
        shift(amount: number, unit: TimeUnit): Date
        isTimeoutReached(amount: number, unit: TimeUnit): boolean
        getDurationTo(date: Date): moment.Duration

        /**
         * By default converts time zone with utcOffset from env
         */
        moment(
            convertToDefaultUtcOffset?:
                | 'convertToDefaultUtcOffset'
                | 'doNotConvertToDefaultUtcOffset'
        ): Moment
    }

    interface DateConstructor {
        new: () => Date
    }
}

export class DateExtensionService {
    initExtensions() {
        Date.prototype.formattedWithAppTimeZone = function (dateFormat?: string): string {
            const format = dateFormat ?? 'YYYY-MM-DD HH:mm:ss'
            return moment(this).utcOffset(internalConstants.app.timeZoneUtcOffset).format(format)
        }

        Date.prototype.shift = function (amount: number, unit: TimeUnit): Date {
            return moment(this).add(amount, unit).toDate()
        }

        Date.prototype.isTimeoutReached = function (amount: number, unit: TimeUnit): boolean {
            return this.shift(amount, unit) < Date.new()
        }

        Date.prototype.getDurationTo = function (date: Date): moment.Duration {
            return moment.duration(moment(this).diff(moment(date)))
        }

        Date.prototype.moment = function (
            convertToDefaultUtcOffset?:
                | 'convertToDefaultUtcOffset'
                | 'doNotConvertToDefaultUtcOffset'
        ): Moment {
            const convertUtcOffset = convertToDefaultUtcOffset
                ? convertToDefaultUtcOffset === 'convertToDefaultUtcOffset'
                : true
            return convertUtcOffset
                ? moment(this).utcOffset(internalConstants.app.timeZoneUtcOffset)
                : moment(this)
        }

        Date.new = function (): Date {
            return new Date()
        }
    }
}

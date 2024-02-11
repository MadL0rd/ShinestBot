import { Injectable } from '@nestjs/common'
import * as moment from 'moment'
import { internalConstants } from 'src/app.internal-constants'

declare global {
    interface Date {
        formattedWithAppTimeZone(dateFormat: string): string
    }

    interface DateConstructor {
        new: () => Date
    }
}

@Injectable()
export class DateExtensionService {
    initExtensions() {
        Date.prototype.formattedWithAppTimeZone = function (dateFormat: string): string {
            return moment(this).utcOffset(internalConstants.appTimeZoneUtcOffset).format(dateFormat)
        }

        Date.new = function (): Date {
            return new Date()
        }
    }
}

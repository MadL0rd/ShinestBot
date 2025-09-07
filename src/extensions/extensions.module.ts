import { ArrayExtensionService } from './array-extension/array-extension.service'
import { BooleanExtensionService } from './boolean-extension/boolean-extension.service'
import { DateExtensionService } from './date-extension/date-extension.service'
import { NumberExtensionService } from './number-extension/number-extension.service'
import { PromiseService } from './promise/promise.service'
import { StringExtensionService } from './string-extension/string-extension.service'
/** New extension service import placeholder */

export class ExtensionsModule {
    static initExtensions() {
        new StringExtensionService().initExtensions()
        new ArrayExtensionService().initExtensions()
        new NumberExtensionService().initExtensions()
        new DateExtensionService().initExtensions()
        new BooleanExtensionService().initExtensions()
        new PromiseService().initExtensions()
        /** New extension service initExtensions method placeholder */
    }
}

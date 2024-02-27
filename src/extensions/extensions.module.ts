import { Module } from '@nestjs/common'
import { ArrayExtensionService } from './array-extension/array-extension.service'
import { StringExtensionService } from './string-extension/string-extension.service'
import { NumberExtensionService } from './number-extension/number-extension.service'
import { DateExtensionService } from './date-extension/date-extension.service'
import { BooleanExtensionService } from './boolean-extension/boolean-extension.service'

@Module({
    providers: [
        ArrayExtensionService,
        StringExtensionService,
        NumberExtensionService,
        DateExtensionService,
        BooleanExtensionService,
    ],
})
export class ExtensionsModule {
    initExtensions() {
        new StringExtensionService().initExtensions()
        new ArrayExtensionService().initExtensions()
        new NumberExtensionService().initExtensions()
        new DateExtensionService().initExtensions()
        new BooleanExtensionService().initExtensions()
    }
}

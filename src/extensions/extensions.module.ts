import { Module } from '@nestjs/common'
import { ArrayExtensionService } from './array-extension/array-extension.service'
import { StringExtensionService } from './string-extension/string-extension.service'
import { NumberExtensionService } from './number-extension/number-extension.service'

@Module({
    providers: [ArrayExtensionService, StringExtensionService, NumberExtensionService],
})
export class ExtensionsModule {
    initExtensions() {
        new StringExtensionService().initExtensions()
        new ArrayExtensionService().initExtensions()
        new NumberExtensionService().initExtensions()
    }
}

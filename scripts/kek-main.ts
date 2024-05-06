import { Module } from '@nestjs/common'
import { CommandFactory } from 'nest-commander'
import { KekModule } from './scripts/kek-module'
import { KekCommand } from './scripts/kek-command'
import { ConfigModule } from '@nestjs/config'
import { SheetDataProviderModule } from '../src/core/sheet-data-provider/sheet-data-provider.module'
import { ExtensionsModule } from '../src/extensions/extensions.module'

@Module({
    imports: [KekModule, ConfigModule.forRoot(), SheetDataProviderModule],
    providers: [KekCommand],
})
export class AppKekModule {}

async function bootstrap() {
    const extensions = new ExtensionsModule()
    extensions.initExtensions()
    await CommandFactory.run(AppKekModule)
}

bootstrap()

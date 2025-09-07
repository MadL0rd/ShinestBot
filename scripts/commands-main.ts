import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommandFactory } from 'nest-commander'
import { SheetDataProviderModule } from '../src/core/sheet-data-provider/sheet-data-provider.module'
import { ExtensionsModule } from '../src/extensions/extensions.module'
import { CacheUniqueMessagesCommand } from './commands/cache-unique-messages.command'

@Module({
    imports: [ConfigModule.forRoot(), SheetDataProviderModule],
    providers: [CacheUniqueMessagesCommand],
})
export class AppCommandsModule {}

async function bootstrap() {
    ExtensionsModule.initExtensions()
    await CommandFactory.run(AppCommandsModule)
}

bootstrap()

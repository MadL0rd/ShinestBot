import { Module } from '@nestjs/common'
import { CommandFactory } from 'nest-commander'
import { CacheUniqueMessagesCommand } from './commands/cache-unique-messages.command'
import { ConfigModule } from '@nestjs/config'
import { SheetDataProviderModule } from '../src/core/sheet-data-provider/sheet-data-provider.module'
import { ExtensionsModule } from '../src/extensions/extensions.module'

@Module({
    imports: [ConfigModule.forRoot(), SheetDataProviderModule],
    providers: [CacheUniqueMessagesCommand],
})
export class AppCommandsModule {}

async function bootstrap() {
    const extensions = new ExtensionsModule()
    extensions.initExtensions()
    await CommandFactory.run(AppCommandsModule)
}

bootstrap()

import { Module } from '@nestjs/common'
import { ModeratedPublicationsService } from './moderated-publications/moderated-publications.service'
import { PublicationStorageModule } from 'src/business-logic/publication-storage/publication-storage.module'
import { BotContentModule } from 'src/business-logic/bot-content/bot-content.module'
import { TelegrafModule } from 'nestjs-telegraf'
import { UserModule } from 'src/business-logic/user/user.module'

@Module({
    imports: [UserModule, BotContentModule, PublicationStorageModule, TelegrafModule],
    providers: [ModeratedPublicationsService],
    exports: [ModeratedPublicationsService],
})
export class PublicationManagementModule {}

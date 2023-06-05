import { Module } from '@nestjs/common'
import { GoogleTablesService } from './google-tables.service'
import { GoogleTablesController } from './google-tables.controller'
import { GoogleCredentialsService } from './google-credentials.service'

@Module({
    controllers: [GoogleTablesController],
    providers: [GoogleTablesService, GoogleCredentialsService],
    exports: [GoogleTablesService],
})
export class GoogleTablesModule {}

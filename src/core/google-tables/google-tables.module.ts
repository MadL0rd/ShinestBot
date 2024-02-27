import { Module } from '@nestjs/common'
import { GoogleTablesService } from './google-tables.service'
import { GoogleCredentialsService } from './google-credentials.service'

@Module({
    controllers: [],
    providers: [GoogleTablesService, GoogleCredentialsService],
    exports: [GoogleTablesService],
})
export class GoogleTablesModule {}

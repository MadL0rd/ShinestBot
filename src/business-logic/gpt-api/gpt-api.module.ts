import { Module } from '@nestjs/common'
import { GptApiService } from './gpt-api.service'

@Module({
    providers: [GptApiService],
    exports: [GptApiService],
})
export class GptApiModule {}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { internalConstants } from 'src/app/app.internal-constants'

@Injectable()
export class ApiAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const ctx = context.switchToHttp()
        const token = ctx.getRequest().headers['authorization']
        return token === `Bearer ${internalConstants.webhookAndPorts.apiAuthToken}`
    }
}

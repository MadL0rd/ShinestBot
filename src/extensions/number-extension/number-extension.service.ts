import { Injectable } from '@nestjs/common'

declare global {
    interface Number {
        get toStringWithSpaces(): string
    }
}

@Injectable()
export class NumberExtensionService {
    initExtensions() {
        Object.defineProperty(Number.prototype, 'toStringWithSpaces', {
            get: function (): string {
                return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')
            },
        })
    }
}

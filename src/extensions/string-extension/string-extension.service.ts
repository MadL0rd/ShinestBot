import { Injectable, OnModuleInit } from '@nestjs/common'

declare global {
    interface String {
        get base64Encoded(): string | null
        get base64Decoded(): string | null
        get isEmpty(): boolean
        get isNotEmpty(): boolean
        get trimmed(): string
        get lowerCased(): string
        get lowerCasedFirstCharOnly(): string
        get upperCased(): string
        get upperCasedFirstCharOnly(): string
    }

    interface StringConstructor {
        fromBase64(base64String: string): string | null
    }
}

@Injectable()
export class StringExtensionService {
    initExtensions() {
        Object.defineProperty(String.prototype, 'base64Encoded', {
            get: function () {
                return Buffer.from(this, 'binary').toString('base64')
            },
        })

        Object.defineProperty(String.prototype, 'base64Decoded', {
            get: function () {
                return String.fromBase64(this)
            },
        })

        Object.defineProperty(String.prototype, 'isEmpty', {
            get: function () {
                return this.length == 0
            },
        })

        Object.defineProperty(String.prototype, 'isNotEmpty', {
            get: function () {
                return this.length > 0
            },
        })

        Object.defineProperty(String.prototype, 'trimmed', {
            get: function () {
                return this.trim()
            },
        })

        Object.defineProperty(String.prototype, 'lowerCased', {
            get: function () {
                return this.toLowerCase()
            },
        })

        Object.defineProperty(String.prototype, 'lowerCasedFirstCharOnly', {
            get: function () {
                return this.charAt(0).toLowerCase() + this.slice(1)
            },
        })

        Object.defineProperty(String.prototype, 'upperCased', {
            get: function () {
                return this.toUpperCase()
            },
        })

        Object.defineProperty(String.prototype, 'upperCasedFirstCharOnly', {
            get: function () {
                return this.charAt(0).toUpperCase() + this.slice(1)
            },
        })

        String.fromBase64 = function (base64String: string): string | null {
            return Buffer.from(base64String, 'base64').toString('binary')
        }
    }
}

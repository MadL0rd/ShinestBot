declare global {
    interface String {
        get base64Encoded(): string | null
        get base64Decoded(): string | null
        get isEmpty(): boolean
        get isNotEmpty(): boolean
        get lowerCasedFirstCharOnly(): string
        get upperCasedFirstCharOnly(): string
        substringOccurrences(substring: string): number[]
    }

    interface StringConstructor {
        fromBase64(base64String: string): string | null
    }
}

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
                return this.length === 0
            },
        })

        Object.defineProperty(String.prototype, 'isNotEmpty', {
            get: function () {
                return this.length > 0
            },
        })

        Object.defineProperty(String.prototype, 'lowerCasedFirstCharOnly', {
            get: function () {
                return this.charAt(0).toLowerCase() + this.slice(1)
            },
        })

        Object.defineProperty(String.prototype, 'upperCasedFirstCharOnly', {
            get: function () {
                return this.charAt(0).toUpperCase() + this.slice(1)
            },
        })

        Object.defineProperty(String.prototype, 'substringOccurrences', {
            value: function (substring: string) {
                const indices: number[] = []
                if (substring === '') return indices
                let index = this.indexOf(substring)

                while (index !== -1) {
                    indices.push(index)
                    index = this.indexOf(substring, index + 1)
                }

                return indices
            },
        })

        String.fromBase64 = function (base64String: string): string | null {
            return Buffer.from(base64String, 'base64').toString('binary')
        }
    }
}

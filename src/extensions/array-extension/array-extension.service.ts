import { Injectable } from '@nestjs/common'

declare global {
    interface Array<T> {
        get first(): T | null
        get last(): T | null
        get isEmpty(): boolean
        get isNotEmpty(): boolean
        get compact(): T[]
        get uniqueOnly(): T[]

        compactMap<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]
    }

    interface ArrayConstructor {
        range: (start: number, count: number) => number[]
    }
}

@Injectable()
export class ArrayExtensionService {
    initExtensions() {
        Object.defineProperty(Array.prototype, 'first', {
            get: function () {
                return this[0]
            },
        })

        Object.defineProperty(Array.prototype, 'last', {
            get: function () {
                return this[this.length - 1]
            },
        })

        Object.defineProperty(Array.prototype, 'isEmpty', {
            get: function () {
                return this.length == 0
            },
        })

        Object.defineProperty(Array.prototype, 'isNotEmpty', {
            get: function () {
                return !this.isEmpty
            },
        })

        Object.defineProperty(Array.prototype, 'compact', {
            get: function () {
                const filteredArray = []
                for (const element of this) {
                    if (typeof element === 'number' && element === 0) {
                        filteredArray.push(element)
                        continue
                    }
                    if (typeof element === 'string' && element.trimmed.isEmpty) continue
                    if (!element) continue
                    filteredArray.push(element)
                }
                return filteredArray
            },
        })

        Object.defineProperty(Array.prototype, 'uniqueOnly', {
            get: function () {
                const result = []
                for (const item of this) {
                    if (!result.includes(item)) result.push(item)
                }
                return result
            },
        })

        Array.prototype.compactMap = function <T, U>(
            callbackfn: (value: T, index: number, array: T[]) => U
        ): U[] {
            return this.map(callbackfn).compact
        }

        Array.range = function (start: number, count: number): number[] {
            const array: number[] = []
            for (let i = start; i < start + count; i++) {
                array.push(i)
            }
            return array
        }
    }
}

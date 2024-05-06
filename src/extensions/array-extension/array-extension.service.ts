import { Injectable } from '@nestjs/common'

declare global {
    interface Array<T> {
        get first(): T | null
        get last(): T | null
        get isEmpty(): boolean
        get isNotEmpty(): boolean
        get compact(): Exclude<T, null | undefined>[]
        get uniqueOnly(): T[]
        get justNotUnique(): T[]
        get randomItem(): T | null
        get copy(): T[]

        /**
         * Use for Array of Promise only
         */
        combinePromises(): Promise<Awaited<T>[]>

        compactMap<U>(
            callbackfn: (value: T, index: number, array: T[]) => U,
            thisArg?: any
        ): Exclude<U, null | undefined>[]

        generateItemsRecord<KeyType extends string | number | symbol>(
            generateKeyFunc: (item: T) => KeyType
        ): Record<KeyType, T>
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

        Object.defineProperty(Array.prototype, 'randomItem', {
            get: function () {
                if (this.isEmpty) return null
                const index = Math.floor(Math.random() * this.length)
                if (index == this.length) return this.last
                return this[index]
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
                const filteredArray: any[] = []
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
                const result: any[] = []
                for (const item of this) {
                    if (!result.includes(item)) result.push(item)
                }
                return result
            },
        })

        Object.defineProperty(Array.prototype, 'justNotUnique', {
            get: function () {
                const sortedArr = this.slice().sort()
                // You can define the comparing function here.
                // JS by default uses a crappy string compare.
                // (we use slice to clone the array so the
                // original array won't be modified)
                const results = []
                for (let i = 0; i < sortedArr.length - 1; i++) {
                    if (sortedArr[i + 1] == sortedArr[i]) {
                        results.push(sortedArr[i])
                    }
                }
                return results
            },
        })

        Object.defineProperty(Array.prototype, 'copy', {
            get: function () {
                return [...this]
            },
        })

        Array.prototype.compactMap = function <T, U>(
            callbackfn: (value: T, index: number, array: T[]) => U
        ): Exclude<U, null | undefined>[] {
            return this.map(callbackfn).compact
        }

        Array.prototype.combinePromises = function (): Promise<any[]> {
            return Promise.all(this)
        }

        Array.prototype.generateItemsRecord = function <
            T,
            KeyType extends string | number | symbol,
        >(generateKeyFunc: (item: T) => KeyType): Record<KeyType, T> {
            return Object.assign(
                {},
                ...this.map((arrayItem) => ({ [generateKeyFunc(arrayItem)]: arrayItem }))
            )
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

declare global {
    interface Array<T> {
        get first(): T | undefined
        get last(): T | undefined
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
            keySelector: (item: T, index: number) => KeyType
        ): Record<KeyType, T>

        /**
         * Groups members of an iterable according to the return value of the passed callback.
         * @param keySelector A callback which will be invoked for each item in items.
         */
        groupBy<KeyType extends string | number | symbol>(
            keySelector: (item: T, index: number) => KeyType
        ): Partial<Record<KeyType, T[]>>
    }

    interface ArrayConstructor {
        range: (start: number, count: number) => number[]
    }
}

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
                if (index === this.length) return this.last
                return this[index]
            },
        })

        Object.defineProperty(Array.prototype, 'isEmpty', {
            get: function () {
                return this.length === 0
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
                    if (
                        typeof element === 'number' &&
                        element === 0 &&
                        Number.isNaN(element) === false
                    ) {
                        filteredArray.push(element)
                        continue
                    }
                    if (typeof element === 'string' && element.trim().isEmpty) continue
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
                    if (sortedArr[i + 1] === sortedArr[i]) {
                        results.push(sortedArr[i])
                    }
                }
                return results
            },
        })

        Object.defineProperty(Array.prototype, 'copy', {
            get: function () {
                return this.slice()
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
        >(keySelector: (item: T, index: number) => KeyType): Record<KeyType, T> {
            return this.reduce((acc, item, index) => {
                return Object.assign(acc, { [keySelector(item, index)]: item })
            }, {})
        }

        Array.prototype.groupBy = function <T, KeyType extends string | number | symbol>(
            keySelector: (item: T, index: number) => KeyType
        ): Partial<Record<KeyType, T[]>> {
            return Object.groupBy(this, keySelector)
        }

        Array.range = function (start: number, count: number): number[] {
            if (count <= 0) return []

            const array: number[] = Array(count)
            for (let value = start, index = 0; index < count; value++, index++) {
                array[index] = value
            }
            return array
        }
    }
}

declare global {
    interface Boolean {
        get isTrue(): boolean
        get isFalse(): boolean
    }
}

export class BooleanExtensionService {
    initExtensions() {
        Object.defineProperty(Boolean.prototype, 'isTrue', {
            get: function () {
                return this === true
            },
        })

        Object.defineProperty(Boolean.prototype, 'isFalse', {
            get: function () {
                return this === false
            },
        })
    }
}

import { StartParam } from '.'

/**
 * Namespace for startParam entity helper functions.
 * This namespace should contain functions that assist in processing or manipulating entity data.
 */
export namespace _StartParamHelper {
    export function isShortType(
        value: StartParam.ParamTypeShort | string | undefined
    ): value is StartParam.ParamTypeShort {
        if (!value) return false
        return Object.keys(StartParam.paramTypesByShortType).includes(value)
    }

    /**
     * String format: `paramTypeShort_value1_value2_...`
     *
     * Telegram restrictions:
     * - Max length 64
     * - Accepted symbols [A-Z][a-z][0-9]-_
     *
     * Use `validate` function to check result safety
     */
    export function encode(data: StartParam.BaseType): string {
        const values: string[] = [StartParam.paramTypes[data.type]]

        switch (data.type) {
            case 'utm':
                values.push(...data.utm)
                break
        }

        return values.join('_')
    }

    /**
     * String format: `shortTypeId_value1_value2_...`
     */
    export function parse(value: string | undefined | null): StartParam.BaseType | undefined {
        if (!value) return undefined
        const components = value.split('_')

        const typeShort = components.shift()
        if (!isShortType(typeShort)) return undefined

        const paramType = StartParam.paramTypesByShortType[typeShort]
        switch (paramType) {
            case 'utm':
                return {
                    type: 'utm',
                    utm: components,
                }
        }
    }

    export function validate(value: string): ValidationResult {
        const startParam = parse(value)
        if (!startParam)
            return {
                isValid: false,
                error: 'invalid format',
            }

        if (value.length > 64)
            return {
                isValid: false,
                error: 'length more then 64 symbols',
            }

        const regexp = new RegExp('^[a-zA-Z0-9_.-]*$')
        if (regexp.test(value) === false)
            return {
                isValid: false,
                error: 'unacceptable symbols',
            }

        return { isValid: true }
    }

    type ValidationResult = ValidationGood | ValidationError
    type ValidationGood = {
        isValid: true
    }
    type ValidationError = {
        isValid: false
        error: ValidationErrorMessage
    }
    type ValidationErrorMessage =
        | 'invalid format'
        | 'length more then 64 symbols'
        | 'unacceptable symbols'
}

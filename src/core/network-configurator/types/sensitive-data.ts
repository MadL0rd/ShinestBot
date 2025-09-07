export type SensitiveData = {
    request?: {
        urlPath?: string[]
        queryParams?: string[]
        headers?: string[]
        /** Array of strings in format 'propLevel1.propLevel2.propLevel3' */
        bodyKeyPaths?: string[]
    }
    response?: {
        headers?: string[]
        /** Array of strings in format 'propLevel1.propLevel2.propLevel3' */
        bodyKeyPaths?: string[]
    }
    result?: {
        /** Array of strings in format 'propLevel1.propLevel2.propLevel3' */
        bodyKeyPaths?: string[]
    }
    maskStrategy?: SensitiveDataMaskStrategy
}

export type SensitiveDataMaskStrategy = {
    maskFullValueOnKeyPath: Set<string>
    maskSubstringOnKeyPath: { keyPath: string; searchValue: string }[]
}

export function mergeSensitiveDataMaskStrategies(
    x1: SensitiveDataMaskStrategy | undefined,
    x2: SensitiveDataMaskStrategy | undefined
): SensitiveDataMaskStrategy | undefined {
    if (x1 && x2) {
        return {
            maskFullValueOnKeyPath: new Set(
                [x1, x2].map((item) => Array.from(item.maskFullValueOnKeyPath)).flat()
            ),
            maskSubstringOnKeyPath: x1.maskSubstringOnKeyPath.concat(x2.maskSubstringOnKeyPath),
        }
    }
    return x1 ?? x2
}

const mergeArrays = (array1?: string[], array2?: string[]): string[] | undefined => {
    if (!array1 && !array2) return undefined
    const result = new Set(array1 ?? [])
    array2?.forEach(result.add, result)
    return Array.from(result)
}

export function mergeSensitiveData(
    x1: SensitiveData | undefined,
    x2: SensitiveData | undefined
): SensitiveData {
    const merged: SensitiveData = {}

    if (x1?.request || x2?.request) {
        merged.request = {
            urlPath: mergeArrays(x1?.request?.urlPath, x2?.request?.urlPath),
            queryParams: mergeArrays(x1?.request?.queryParams, x2?.request?.queryParams),
            headers: mergeArrays(x1?.request?.headers, x2?.request?.headers),
            bodyKeyPaths: mergeArrays(x1?.request?.bodyKeyPaths, x2?.request?.bodyKeyPaths),
        }
    }

    if (x1?.response || x2?.response) {
        merged.response = {
            headers: mergeArrays(x1?.response?.headers, x2?.response?.headers),
            bodyKeyPaths: mergeArrays(x1?.response?.bodyKeyPaths, x2?.response?.bodyKeyPaths),
        }
    }

    if (x1?.result || x2?.result) {
        merged.result = {
            bodyKeyPaths: mergeArrays(x1?.result?.bodyKeyPaths, x2?.result?.bodyKeyPaths),
        }
    }

    return merged
}

export function buildMaskStrategy(sensitive: SensitiveData | undefined): SensitiveDataMaskStrategy {
    if (!sensitive) {
        return {
            maskFullValueOnKeyPath: new Set(),
            maskSubstringOnKeyPath: [],
        }
    }
    const sensitiveDataPaths: Set<string> = new Set()

    sensitive.request?.queryParams?.forEach((param) => {
        sensitiveDataPaths.add(`request.queryParams.${param}`)
    })
    sensitive.request?.headers?.forEach((header) => {
        sensitiveDataPaths.add(`request.headers.${header}`)
    })
    sensitive.request?.bodyKeyPaths?.forEach((dataValue) => {
        sensitiveDataPaths.add(`request.body.${dataValue}`)
    })

    sensitive.response?.headers?.forEach((header) => {
        sensitiveDataPaths.add(`response.headers.${header}`)
    })
    sensitive.response?.bodyKeyPaths?.forEach((dataValue) => {
        sensitiveDataPaths.add(`response.body.${dataValue}`)
    })

    sensitive.result?.bodyKeyPaths?.forEach((dataValue) => {
        sensitiveDataPaths.add(`result.body.${dataValue}`)
    })

    sensitive.maskStrategy?.maskFullValueOnKeyPath.forEach((fillPath) => {
        sensitiveDataPaths.add(fillPath)
    })

    const sensitiveString: { keyPath: string; searchValue: string }[] =
        sensitive.maskStrategy?.maskSubstringOnKeyPath ?? []

    sensitive.request?.urlPath?.forEach((value) => {
        sensitiveString.push({
            keyPath: 'request.url',
            searchValue: value,
        })
    })

    return {
        maskFullValueOnKeyPath: sensitiveDataPaths,
        maskSubstringOnKeyPath: sensitiveString,
    }
}

import { IntRange } from 'src/entities/common/int-range.type'

export namespace HttpMethod {
    export type Union = 'GET' | 'HEAD' | 'PUT' | 'DELETE' | 'POST' | 'PATCH'

    export type BodyAllowed = Exclude<Union, 'GET' | 'HEAD'>
    export type BodyForbidden = Extract<Union, 'GET' | 'HEAD'>

    export function allowsBody(method: Union): method is BodyAllowed {
        return method !== 'GET' && method !== 'HEAD'
    }
}

/**
 * Source:
 * https://developer.mozilla.org/docs/Web/HTTP/Reference/Status
 */
export namespace StatusCodes {
    export type InformationalResponses = IntRange<100, 199>
    export type SuccessfulResponses = IntRange<200, 299>
    export type RedirectionMessages = IntRange<300, 399>
    export type ClientErrorResponses = IntRange<400, 499>
    export type ServerErrorResponses = IntRange<500, 599>

    export type All = IntRange<100, 599>
}

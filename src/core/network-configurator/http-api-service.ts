import { LoggerService } from '@nestjs/common'
import { ResponseType } from 'node-fetch'
import { Result } from 'src/utils/result'
import { z } from 'zod'
import { ExpectedResponses, HttpEndpointRequestDto } from './http-api-endpoint'
import { HttpMethod, StatusCodes } from './types/http-method'
import { SensitiveDataMaskStrategy } from './types/sensitive-data'
import { replacerWithPath } from './utils/replacer-with-path'

export type HttpApiEndpointDto<Input, ResponseSchema extends ExpectedResponses> = {
    timeoutMs?: number
    buildRequest: (args: Input) => Promise<Result<HttpEndpointRequestDto<ResponseSchema>>>
    maskStrategy: SensitiveDataMaskStrategy
}
export type AnyHttpApiEndpointDto = HttpApiEndpointDto<any, any>

type HttpApiServiceConstructorConfig<Endpoints extends Record<string, AnyHttpApiEndpointDto>> = {
    baseUrl: string
    endpoints: Endpoints
    transform?: (endpoint: Endpoints[keyof Endpoints]) => AnyHttpApiEndpointDto
    defaultRequestTimeoutMs?: number
    logging?: {
        name?: string
        logger?: LoggerService
    }
}

type HttpApiServiceConfig = {
    baseUrl: string
    defaultRequestTimeoutMs: number
    logging?: {
        name?: string
        logger?: LoggerService
    }
}

type EndpointCallResult<Endpoint extends AnyHttpApiEndpointDto> =
    | EndpointCallResultSuccessDefault<Endpoint>
    | EndpointCallResultSuccessOther<Endpoint>
    | EndpointCallResultExpectedError<Endpoint>
    | EndpointCallResultFailure

type EndpointCallResultSuccessDefault<Endpoint extends AnyHttpApiEndpointDto> =
    Endpoint extends HttpApiEndpointDto<any, infer ExpectedResults>
        ? {
              success: true
              successType: 'DEFAULT'
              statusCode: Exclude<StatusCodes.SuccessfulResponses, keyof ExpectedResults>
              statusText: string
              data: z.infer<ExpectedResults['ok']>
          }
        : never

type ValuesOf<T> = T[keyof T]

type EndpointCallResultSuccessOther<Endpoint> =
    Endpoint extends HttpApiEndpointDto<any, infer ExpectedResults>
        ? ValuesOf<{
              [StatusCode in keyof ExpectedResults]: StatusCode extends StatusCodes.SuccessfulResponses
                  ? ExpectedResults[StatusCode] extends z.Schema
                      ? {
                            success: true
                            successType: 'OTHER'
                            statusCode: StatusCode
                            statusText: string
                            data: z.infer<ExpectedResults[StatusCode]>
                        }
                      : never
                  : never
          }>
        : never

type EndpointCallResultExpectedError<Endpoint> =
    Endpoint extends HttpApiEndpointDto<any, infer ExpectedResults>
        ? ValuesOf<{
              [StatusCode in keyof ExpectedResults]: StatusCode extends
                  | StatusCodes.ServerErrorResponses
                  | StatusCodes.ClientErrorResponses
                  ? ExpectedResults[StatusCode] extends z.Schema
                      ? {
                            success: false
                            statusCode: StatusCode
                            statusText: string
                            errorType: 'EXPECTED_ERROR'
                            data: z.infer<ExpectedResults[StatusCode]>
                        }
                      : never
                  : never
          }>
        : never

type EndpointCallResultFailure =
    | {
          success: false
          statusCode?: undefined
          statusText?: undefined
          errorType: 'INVALID_INPUT_DATA' | 'TIMEOUT' | 'REQUEST_FAILS'
          error: unknown
      }
    | {
          success: false
          statusCode: number
          statusText: string
          errorType: 'DATA_FETCHING_FAILS'
          error: unknown
      }
    | {
          success: false
          statusCode: number
          statusText: string
          errorType: 'UNEXPECTED_STATUS_CODE' | 'INVALID_RESPONSE'
          error: unknown
          originalData: unknown
      }

type HttpRequestDto = {
    method: HttpMethod.Union
    url: string
    queryParams: Record<string, string>
    headers: Record<string, string>
    body?: unknown
    timeout: number
}
type HttpResponseDto = {
    ok: boolean
    status: StatusCodes.All
    statusText: string
    type: ResponseType
    headers: Record<string, string>
    data: null | unknown
    receiveResponseDuration: null | number
    requestTotalDuration: null | number
}

type RequestResultInfo = {
    readonly request?: HttpRequestDto
    readonly response?: HttpResponseDto
    readonly result: EndpointCallResult<any>
}

type IsEmpty<T> = T extends Record<string, never> ? true : false
type InputParams<Endpoint> = Endpoint extends HttpApiEndpointDto<infer Input, any> ? Input : null

export type EndpointCallFunction<Endpoint extends AnyHttpApiEndpointDto> =
    IsEmpty<InputParams<Endpoint>> extends true
        ? () => Promise<EndpointCallResult<Endpoint>>
        : (args: InputParams<Endpoint>) => Promise<EndpointCallResult<Endpoint>>

type ApiMethods<Endpoints extends Record<string, AnyHttpApiEndpointDto>> = {
    [Alias in keyof Endpoints]: EndpointCallFunction<Endpoints[Alias]>
}

export class HttpApiService<Endpoints extends Record<string, AnyHttpApiEndpointDto>> {
    public readonly config: HttpApiServiceConfig
    public readonly call: ApiMethods<Endpoints>

    constructor(config: HttpApiServiceConstructorConfig<Endpoints>) {
        this.config = {
            baseUrl: config.baseUrl,
            defaultRequestTimeoutMs: config.defaultRequestTimeoutMs ?? 5000,
            logging: config.logging,
        }

        this.call = Object.entries(config.endpoints).reduce((acc, [alias, endpointOriginal]) => {
            const endpoint = config.transform
                ? config.transform(endpointOriginal as Endpoints[keyof Endpoints])
                : endpointOriginal

            return Object.assign(acc, {
                [alias]: async <Endpoint extends typeof endpointOriginal>(
                    inputData: InputParams<Endpoint>
                ): Promise<EndpointCallResult<Endpoint>> => {
                    return this.processApiCall({ alias, endpoint, inputData }) as Promise<
                        EndpointCallResult<Endpoint>
                    >
                },
            })
        }, {} as ApiMethods<Endpoints>)
    }

    private async processApiCall<
        Input,
        Responses extends ExpectedResponses,
        Endpoint extends HttpApiEndpointDto<Input, Responses>,
    >(args: {
        alias: string
        endpoint: Endpoint
        inputData: Input
    }): Promise<EndpointCallResult<Endpoint>> {
        const { alias, endpoint } = args

        const requestDtoBuildResult = await endpoint.buildRequest(args.inputData)

        if (requestDtoBuildResult.success === false) {
            const result: EndpointCallResultFailure = {
                success: false,
                errorType: 'INVALID_INPUT_DATA',
                error: requestDtoBuildResult.error,
            }
            this.logRequestInfo({
                level: 'error',
                endpointAlias: alias,
                message: 'Request build failed',
                maskStrategy: undefined,
                data: {
                    result: result,
                },
            })
            return result
        }

        const {
            responses: responseSchemasByStatusCodes,
            sensitiveDataMaskStrategy,
            ...requestDto
        } = requestDtoBuildResult.result

        const request: HttpRequestDto = {
            method: requestDto.method,
            url: `${this.config.baseUrl}${requestDto.path}`,
            queryParams: requestDto.queryParams ?? {},
            headers: requestDto.headers ?? {},
            body: requestDto.body,
            timeout: requestDto.timeoutMs ?? this.config.defaultRequestTimeoutMs,
        }

        const executeRequestResult = await this.executeRequest(request)
        if (executeRequestResult.success === false) {
            this.logRequestInfo({
                level: 'error',
                endpointAlias: alias,
                message: 'Request failed',
                maskStrategy: sensitiveDataMaskStrategy,
                data: {
                    request,
                    result: executeRequestResult.result,
                    response: executeRequestResult.response,
                },
            })
            return executeRequestResult.result
        }
        const { response } = executeRequestResult

        if (response.ok === false) {
            const expectedErrorSchema = responseSchemasByStatusCodes[response.status]
            if (expectedErrorSchema) {
                const parseResult = expectedErrorSchema.safeParse(response.data)
                if (parseResult.success) {
                    const result = {
                        success: false,
                        statusCode: response.status,
                        statusText: response.statusText,
                        errorType: 'EXPECTED_ERROR',
                        data: response.data,
                    } as EndpointCallResultExpectedError<Endpoint>
                    this.logRequestInfo({
                        level: 'warn',
                        endpointAlias: alias,
                        message: 'Request failed with expected error',
                        maskStrategy: sensitiveDataMaskStrategy,
                        data: { request, result, response },
                    })

                    return result
                }
            }
            const result: EndpointCallResultFailure = {
                success: false,
                statusCode: response.status,
                statusText: response.statusText,
                errorType: 'UNEXPECTED_STATUS_CODE',
                error: Error('UNEXPECTED_STATUS_CODE'),
                originalData: response.data,
            }
            this.logRequestInfo({
                level: 'error',
                endpointAlias: alias,
                message: 'Request failed',
                maskStrategy: sensitiveDataMaskStrategy,
                data: { request, result, response },
            })

            return result
        }

        const targetResponseParser = responseSchemasByStatusCodes[response.status]
            ? {
                  type: 'OTHER',
                  schema: responseSchemasByStatusCodes[response.status],
              }
            : {
                  type: 'DEFAULT',
                  schema: responseSchemasByStatusCodes.ok,
              }
        const parseResult = targetResponseParser.schema!.safeParse(response.data)
        if (parseResult.success === false) {
            const result: EndpointCallResultFailure = {
                success: false,
                statusCode: response.status,
                statusText: response.statusText,
                errorType: 'INVALID_RESPONSE',
                error: parseResult.error,
                originalData: response.data,
            }
            this.logRequestInfo({
                level: 'error',
                endpointAlias: alias,
                message: 'Request failed',
                maskStrategy: sensitiveDataMaskStrategy,
                data: { request, result, response },
            })

            return result
        }

        const result = {
            success: true,
            successType: targetResponseParser.type,
            statusCode: response.status,
            statusText: response.statusText,
            data: parseResult.data,
        } as EndpointCallResult<Endpoint>

        this.logRequestInfo({
            level: 'log',
            endpointAlias: alias,
            message: 'Request completed successfully',
            maskStrategy: sensitiveDataMaskStrategy,
            data: { request, result, response },
        })

        return result
    }

    private logRequestInfo(args: {
        level: 'log' | 'error' | 'warn'
        endpointAlias: string
        message: string
        maskStrategy: SensitiveDataMaskStrategy | undefined
        data: RequestResultInfo
    }) {
        const { level, endpointAlias, message, maskStrategy: sensitive, data } = args

        const dataString = sensitive
            ? this.stringifyWithSensitiveDataMasking({
                  data,
                  maskStrategy: sensitive,
                  stringifySpace: level === 'error' ? 2 : undefined,
              })
            : JSON.stringify(data)
        const text = `${message}: ${[this.config.logging?.name, endpointAlias].compact.join('.')}\n${dataString}`

        if (this.config.logging?.logger) {
            this.config.logging?.logger[level](text)
        } else {
            console[level](text)
        }
    }

    private stringifyWithSensitiveDataMasking(args: {
        data: RequestResultInfo
        maskStrategy: SensitiveDataMaskStrategy | undefined
        stringifySpace: number | string | undefined
    }): string {
        const { data, maskStrategy, stringifySpace } = args

        if (!maskStrategy) return JSON.stringify(data)
        const mask = '[-SENSITIVE-DATA-]'

        return JSON.stringify(
            data,
            replacerWithPath(function (field, originalValue, keyPath) {
                if (maskStrategy.maskFullValueOnKeyPath.has(keyPath)) return mask

                if (typeof originalValue === 'string') {
                    const stringMasks = maskStrategy.maskSubstringOnKeyPath.filter(
                        (value) => value.keyPath === keyPath
                    )
                    if (stringMasks.isNotEmpty) {
                        return stringMasks.reduce(
                            (acc, current) => acc.replaceAll(current.searchValue, mask),
                            originalValue
                        )
                    }
                }

                return originalValue
            }),
            stringifySpace
        )
    }

    private async executeRequest(requestDto: HttpRequestDto): Promise<
        | {
              success: true
              response: HttpResponseDto
          }
        | {
              success: false
              result: EndpointCallResultFailure
              response?: HttpResponseDto
          }
    > {
        const paramsString = new URLSearchParams(requestDto.queryParams).toString()
        const url = paramsString.isEmpty ? requestDto.url : `${requestDto.url}?${paramsString}`

        const abortController = new AbortController()
        const requestStartTime = Date.now()

        const response = await Promise.race([
            Promise.retry({
                call: () =>
                    fetch(url, {
                        method: requestDto.method,
                        headers: requestDto.headers,
                        body: HttpMethod.allowsBody(requestDto.method)
                            ? JSON.stringify(requestDto.body)
                            : undefined,
                        signal: abortController.signal,
                    }).then((response) => {
                        return { success: true, result: response } as const
                    }),
                count: 3,
            }).catch((error) => {
                return error instanceof DOMException && error.name == 'AbortError'
                    ? ({
                          success: false,
                          errorType: 'TIMEOUT',
                          error: Error(
                              `Request was aborted by signal timed out (${requestDto.timeout}ms)`
                          ),
                      } satisfies EndpointCallResultFailure)
                    : ({
                          success: false,
                          errorType: 'REQUEST_FAILS',
                          error: error,
                      } satisfies EndpointCallResultFailure)
            }),

            new Promise((resolve) => setTimeout(resolve, requestDto.timeout)).then(() => {
                abortController.abort()
                return {
                    success: false,
                    errorType: 'TIMEOUT',
                    error: Error(
                        `Request was aborted by signal timed out (${requestDto.timeout}ms)`
                    ),
                } satisfies EndpointCallResultFailure
            }),
        ])
        if (response.success === false) {
            return {
                success: false,
                result: response,
            }
        }

        const responseDto: HttpResponseDto = {
            ok: response.result.ok,
            status: response.result.status as StatusCodes.All,
            statusText: response.result.statusText,
            type: response.result.type,
            headers: Object.fromEntries(response.result.headers.entries()),
            data: null,
            receiveResponseDuration: Date.now() - requestStartTime,
            requestTotalDuration: null,
        }

        const contentType = response.result.headers.get('Content-Type')
        const dataFetching = contentType?.startsWith('application/json')
            ? await response.result.json().tryResult()
            : await response.result.text().tryResult()

        if (dataFetching.success === false) {
            return {
                success: false,
                result: {
                    success: false,
                    statusCode: responseDto.status,
                    statusText: responseDto.statusText,
                    errorType: 'DATA_FETCHING_FAILS',
                    error: dataFetching.error,
                },
                response: responseDto,
            }
        }
        responseDto.data = dataFetching.result
        responseDto.requestTotalDuration = Date.now() - requestStartTime

        return {
            success: true,
            response: responseDto,
        }
    }
}

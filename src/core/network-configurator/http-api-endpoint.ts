import { randomUUID } from 'crypto'
import { Result } from 'src/utils/result'
import z from 'zod'
import { HttpMethod, StatusCodes } from './types/http-method'
import {
    buildMaskStrategy,
    mergeSensitiveData,
    mergeSensitiveDataMaskStrategies,
    SensitiveData,
    SensitiveDataMaskStrategy,
} from './types/sensitive-data'

export type HttpRequestDto = HttpRequestBodyAllowedDto | HttpRequestBodyForbiddenDto
export type HttpRequestBodyAllowedDto = {
    method: HttpMethod.BodyAllowed
    path: string
    queryParams?: Record<string, string>
    headers?: Record<string, string>
    body?: unknown
    timeoutMs?: number
}
export type HttpRequestBodyForbiddenDto = {
    method: HttpMethod.BodyForbidden
    path: string
    queryParams?: Record<string, string>
    headers?: Record<string, string>
    body?: undefined
    timeoutMs?: number
}

/**
 * Record<StatusCode, ResponseSchema>
 */
export type ExpectedResponses = {
    ok: z.Schema
} & Partial<Record<StatusCodes.All, z.Schema>>

export type HttpEndpointRequestDto<ExpectedResults extends ExpectedResponses> = HttpRequestDto & {
    responses: ExpectedResults
    sensitiveDataMaskStrategy?: SensitiveDataMaskStrategy
}
export type HttpEndpointRequestAnyDto = HttpEndpointRequestDto<any>

type HttpApiEndpointRequestBuildFunc<Input, Output extends ExpectedResponses> = (
    data: Input
) => HttpEndpointRequestDto<Output>

type HttpApiEndpointBuildMiddleware =
    | {
          type: 'sync'
          func: (requestDto: HttpEndpointRequestAnyDto) => HttpEndpointRequestAnyDto
      }
    | {
          type: 'async'
          func: (requestDto: HttpEndpointRequestAnyDto) => Promise<HttpEndpointRequestAnyDto>
      }

type HttpApiEndpointMetadata = Readonly<Record<string, string>>

export class HttpApiEndpoint<
    Input,
    Output extends ExpectedResponses,
    Metadata extends HttpApiEndpointMetadata,
> {
    private middlewares: HttpApiEndpointBuildMiddleware[]
    private maskStrategyData: SensitiveDataMaskStrategy
    private sensitiveDataInfo: SensitiveData | undefined

    public readonly buildFunc: HttpApiEndpointRequestBuildFunc<Input, Output>
    public readonly metadata: Metadata

    get maskStrategy(): SensitiveDataMaskStrategy {
        return this.maskStrategyData
    }

    constructor(args: {
        buildFunc: HttpApiEndpointRequestBuildFunc<Input, Output>
        sensitiveDataInfo?: SensitiveData
        metadata: Metadata
    }) {
        this.buildFunc = args.buildFunc
        this.sensitiveDataInfo = args.sensitiveDataInfo
        this.metadata = args.metadata

        this.middlewares = []
        this.maskStrategyData = buildMaskStrategy(this.sensitiveDataInfo)
    }

    addBuildMiddleware(middleware: HttpApiEndpointBuildMiddleware) {
        this.middlewares.push(middleware)
    }

    addBuildMiddlewareContentType(contentType: 'application/json') {
        this.addBuildMiddleware({
            type: 'sync',
            func: function (requestDto: HttpEndpointRequestAnyDto): HttpEndpointRequestAnyDto {
                requestDto.headers = {
                    ...requestDto.headers,
                    'Content-Type': contentType,
                }
                return requestDto
            },
        })
    }

    addBuildMiddlewareCommonData(data: {
        queryParams?: Record<string, string>
        headers?: Record<string, string>
        body?: object
    }) {
        this.addBuildMiddleware({
            type: 'sync',
            func: function (requestDto: HttpEndpointRequestAnyDto): HttpEndpointRequestAnyDto {
                requestDto.queryParams = {
                    ...data.queryParams,
                    ...requestDto.queryParams,
                }
                requestDto.headers = { ...data.headers, ...requestDto.headers }
                requestDto.body =
                    typeof requestDto.body !== 'object' ||
                    !requestDto.body ||
                    Array.isArray(requestDto.body)
                        ? (requestDto.body ?? data.body)
                        : { ...data.body, ...requestDto.body }
                return requestDto
            },
        })
    }

    addBuildMiddlewareUuid() {
        this.addBuildMiddleware({
            type: 'sync',
            func: function (requestDto: HttpEndpointRequestAnyDto): HttpEndpointRequestAnyDto {
                requestDto.headers = {
                    ...requestDto.headers,
                    UUID: randomUUID().toString(),
                }
                return requestDto
            },
        })
    }

    addSensitiveData(newSensitiveDataInfo: SensitiveData) {
        this.sensitiveDataInfo = mergeSensitiveData(this.sensitiveDataInfo, newSensitiveDataInfo)
        this.maskStrategyData = buildMaskStrategy(this.sensitiveDataInfo)
    }

    async buildRequest(data: Input): Promise<Result<HttpEndpointRequestDto<Output>>> {
        try {
            let requestDto = this.buildFunc(data)
            for (let index = 0; index < this.middlewares.length; index++) {
                const middleware = this.middlewares[index]
                switch (middleware.type) {
                    case 'sync':
                        requestDto = middleware.func(requestDto)
                        break
                    case 'async':
                        requestDto = await middleware.func(requestDto)
                        break
                }
            }
            requestDto.sensitiveDataMaskStrategy = mergeSensitiveDataMaskStrategies(
                requestDto.sensitiveDataMaskStrategy,
                this.maskStrategyData
            )

            return { success: true, result: requestDto }
        } catch (error) {
            return {
                success: false,
                error: error,
            }
        }
    }
}

export const makeEndpoint = {
    withBuildFunc: <
        Input,
        OutputSchema extends ExpectedResponses,
        Metadata extends HttpApiEndpointMetadata,
    >(args: {
        buildFunc: HttpApiEndpointRequestBuildFunc<Input, OutputSchema>
        sensitiveDataInfo?: SensitiveData
        metadata: Metadata
    }) => {
        return new HttpApiEndpoint(args)
    },

    withBuildSchema: <
        BuildSchema extends z.Schema<HttpEndpointRequestAnyDto, any, any>,
        Metadata extends HttpApiEndpointMetadata,
    >(args: {
        buildSchema: BuildSchema
        sensitiveDataInfo?: SensitiveData
        metadata: Metadata
    }) => {
        const { buildSchema, ...argsOther } = args
        return new HttpApiEndpoint({
            ...argsOther,
            buildFunc: (data: z.input<BuildSchema>) => {
                return buildSchema.parse(data)
            },
        }) as HttpApiEndpoint<z.input<BuildSchema>, z.infer<BuildSchema>['responses'], Metadata>
    },
}

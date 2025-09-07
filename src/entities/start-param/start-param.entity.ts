import { swapFn } from 'src/utils/swap-fn'
import z from 'zod'
import { _StartParamFormatter } from './start-param.formatter'
import { _StartParamHelper } from './start-param.helper'

/**
 * Namespace for StartParam entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _StartParamEntity {
    export import Helper = _StartParamHelper
    export import Formatter = _StartParamFormatter

    export type BaseType = Utm

    export type ParamType = keyof typeof paramTypes
    export type ParamTypeShort = (typeof paramTypes)[ParamType]

    export const paramTypes = {
        utm: 'utm',
    } as const
    export const paramTypesByShortType = swapFn(paramTypes)

    export type ParamCommon = {
        type: ParamType
        utm: string[]
    }

    export type Utm = ParamCommon & {
        type: 'utm'
    }

    export const startParamSchema = z
        .discriminatedUnion('type', [
            z.object({
                type: z.literal('utm'),
            }),
        ])
        .and(
            z.object({
                utm: z.string().array(),
            })
        )
}

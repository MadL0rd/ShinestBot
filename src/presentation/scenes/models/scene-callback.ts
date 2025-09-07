import z from 'zod'
import { SceneName } from './scene-name.enum'

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 *
 * Try to keep values as concise as possible
 */
export namespace SceneCallbackAction {
    export type Union = keyof typeof values
    export const values = {
        segueButton: 0,
        textContactSupport: 1,
        surveySkipQuestion: 2,
        surveyBackToPreviousQuestion: 3,
        currentSceneAction: 5,

        mailingMessageMainMenuAction: 30,

        storageChatActionMailingPause: 50,
        storageChatActionMailingContinue: 51,
        storageChatActionMailingRemoveMessages: 52,
    } as const

    export const allCases = Object.keys(values) as Union[]

    export function includes(value: string | Union): value is Union {
        return value in values
    }

    export function getId(actionName: Union): number {
        return values[actionName]
    }

    export function getById(id: number): Union | null {
        for (const [key, value] of Object.entries(values)) {
            const actionName = key as Union
            if (value === id) return actionName
        }
        return null
    }
}

function getActionNameLiteral<LiteralType extends SceneCallbackAction.Union>(literal: LiteralType) {
    return z.literal(literal)
}

const callbackActionDataSchema = z.discriminatedUnion('actionType', [
    z.object({
        actionType: getActionNameLiteral('surveySkipQuestion'),
        data: z.object({
            /** provider id */
            p: z.number(),
            /** answer id */
            a: z.string(),
        }),
    }),
    z.object({
        actionType: getActionNameLiteral('surveyBackToPreviousQuestion'),
        data: z.object({
            /** provider id */
            p: z.number(),
            /** answer id */
            a: z.string(),
        }),
    }),
    z.object({
        actionType: getActionNameLiteral('currentSceneAction'),
        data: z.any(),
    }),

    z.object({
        actionType: getActionNameLiteral('mailingMessageMainMenuAction'),
        data: z.object({
            // MainMenu button id
            id: z.string(),
            // Mailing object unique id
            u: z.union([z.number().transform((value) => value.toString()), z.string()]).optional(),
        }),
    }),

    z.object({
        actionType: z.enum([
            'storageChatActionMailingPause',
            'storageChatActionMailingContinue',
            'storageChatActionMailingRemoveMessages',
        ] as const satisfies SceneCallbackAction.Union[]),
        data: z.object({
            // mailingId
            mId: z.string(),
        }),
    }),
])

export type CallbackActionData = z.infer<typeof callbackActionDataSchema>

/**
 * Max callback data size is 64 chars in UTF-8
 * MongoDB id length: 24
 */

export const sceneCallbackDataCompressedSchema = z
    .union([z.string().transform((queryData) => JSON.parse(queryData)), z.object({})])
    .pipe(
        z.object({
            s: z.number(),
            a: z.number(),
            d: z.any(),
        })
    )
    .transform((callbackData, ctx) => {
        const sceneName = SceneName.getById(callbackData.s)
        if (!sceneName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid scene name id',
            })
            return z.NEVER
        }

        const actionType = SceneCallbackAction.getById(callbackData.a)
        if (!actionType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid SceneCallbackAction id',
            })
            return z.NEVER
        }

        const actionParseResult = callbackActionDataSchema.safeParse({
            actionType: actionType,
            data: callbackData.d,
        })
        if (!actionParseResult.success) {
            for (const issue of actionParseResult.error.issues) {
                ctx.addIssue(issue)
            }
            return z.NEVER
        }

        return {
            sceneName: sceneName,
            action: actionParseResult.data,
        }
    })

export function compressCallbackData(args: {
    sceneName: SceneName.Union
    callbackData: CallbackActionData
}): string {
    return JSON.stringify({
        s: SceneName.getId(args.sceneName),
        a: SceneCallbackAction.getId(args.callbackData.actionType),
        d: args.callbackData.data ?? {},
    })
}

export type SceneCallbackData = CallbackActionData

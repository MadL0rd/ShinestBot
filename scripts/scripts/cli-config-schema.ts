import * as z from 'zod'

export const FormatSchema = z.object({
    applyOnCommandsCompletion: z.boolean(),
    scrypt: z.string().optional(),
})
export type Format = z.infer<typeof FormatSchema>

export const CreateFileSchema = z.object({
    baseDir: z.string(),
    name: z.string(),
    templateFile: z.string(),
})
export type CreateFile = z.infer<typeof CreateFileSchema>

export const NamePlaceholdersSchema = z.object({
    caseCamel: z.string(),
    casePascal: z.string(),
    caseKebub: z.string(),
})
export type NamePlaceholders = z.infer<typeof NamePlaceholdersSchema>

export const ReplacementSchema = z.object({
    filePath: z.string(),
    placeholder: z.string(),
    replaceWith: z.string(),
})
export type Replacement = z.infer<typeof ReplacementSchema>

export const UniqueMessagesSchema = z.object({
    jsonConfigFilePath: z.string(),
    cacheConfigCommand: z.string(),
    resultSourceCodeFilePath: z.string(),
})
export type UniqueMessages = z.infer<typeof UniqueMessagesSchema>

export const GitSchema = z.object({
    commitMessage: z.string(),
})

export const OtherSchema = z.object({
    title: z.string(),
    nameQuestion: z.string(),
    namePlaceholders: NamePlaceholdersSchema,
    createFiles: z.array(CreateFileSchema),
    replacements: z.array(ReplacementSchema),
    git: GitSchema.optional(),
})
export type Other = z.infer<typeof OtherSchema>

export const GenerationScriptsSchema = z.object({
    uniqueMessages: UniqueMessagesSchema,
    other: z.array(OtherSchema),
})
export type GenerationScripts = z.infer<typeof GenerationScriptsSchema>

export const CliConfigSchema = z.object({
    format: FormatSchema,
    generationScripts: GenerationScriptsSchema,
})
export type CliConfig = z.infer<typeof CliConfigSchema>

export const ParamSchema = z.object({
    name: z.string(),
    type: z.enum(['number', 'string']),
})
export type Param = z.infer<typeof ParamSchema>

export const UniqueMessagesConfigElementSchema = z.object({
    group: z.string(),
    key: z.string(),
    value: z.string(),
    params: z.array(ParamSchema),
    comment: z.string().optional(),
})
export type UniqueMessagesConfigElement = z.infer<typeof UniqueMessagesConfigElementSchema>

export const UniqueMessagesConfigSchema = z.array(UniqueMessagesConfigElementSchema)
export type UniqueMessagesConfig = z.infer<typeof UniqueMessagesConfigElementSchema>

export type NullishProp<Type, KeyOptional extends keyof Type> = {
    [K in keyof Type]: K extends KeyOptional ? Type[K] | null | undefined : Type[K]
}

export type Nullish<Type> = Type | null | undefined

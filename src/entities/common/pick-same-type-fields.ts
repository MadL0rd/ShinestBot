export type SameTypeFields<BaseType, Field extends keyof BaseType> = keyof PickSameTypeFields<
    BaseType,
    Field
>

export type PickSameTypeFields<BaseType, Field extends keyof BaseType> = PickByType<
    BaseType,
    BaseType[Field]
>

export type PickByType<BaseType, FieldType> = {
    [P in keyof BaseType as BaseType[P] extends FieldType | undefined ? P : never]: BaseType[P]
}

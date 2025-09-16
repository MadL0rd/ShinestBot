type UnionMembersAsFunctions<UnionType> = UnionType extends any ? (arg: UnionType) => void : never
export type UnionToIntersection<UnionType> =
    UnionMembersAsFunctions<UnionType> extends (arg: infer IntersectionType) => void
        ? IntersectionType
        : never

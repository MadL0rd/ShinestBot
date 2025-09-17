import { Types } from 'mongoose'

export type MongoDocument<BaseType> = BaseType & { readonly _id: Types.ObjectId }

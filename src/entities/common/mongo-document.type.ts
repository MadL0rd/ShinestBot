import { Types } from 'mongoose'

export type MongoDocument<BaseType> = BaseType & { _id: Types.ObjectId }

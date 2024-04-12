import { PublicationSchema } from '../schemas/publication.schema'

export type PublicationCreateDto = PublicationSchema
export type PublicationUpdateDto = Partial<PublicationSchema>

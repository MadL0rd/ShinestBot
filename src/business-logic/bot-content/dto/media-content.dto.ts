import { MediaContent } from 'src/entities/common/media-content.entity'

export type MediaContentDto = {
    [Key in keyof MediaContent]?: string | undefined
}

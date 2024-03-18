import { LocalizedStringParameter } from './localization.localized-string-parameter'

export class LocalizedString {
    groupName: string
    key: string
    comment?: string
    parameters: LocalizedStringParameter[]
    localizedValues: Record<string, string>
}

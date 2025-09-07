import { UserProfileDocument } from 'src/business-logic/user/schemas/user.schema'
import { UserProfile } from '.'

/**
 * Namespace for UserProfile entity formatter functions.
 * This namespace should contain functions responsible for formatting entity data.
 */
export namespace _UserProfileFormatter {
    export function getTgUserString(
        telegramInfo: UserProfile.TelegramInfo,
        format?: {
            username?: 'short' | 'link' | 'none'
            addUserId?: boolean
            separator?: string
        }
    ) {
        const formatDefault: typeof format = {
            username: 'short',
            addUserId: true,
            separator: ' ',
        }

        const { username: usernameFormat, addUserId, separator } = { ...formatDefault, ...format }
        let username: string | null = null
        if (telegramInfo.username) {
            switch (usernameFormat) {
                case 'link':
                    username = `https://t.me/` + telegramInfo.username
                    break
                case 'short':
                    username = '@' + telegramInfo.username
                    break
                case undefined:
                case 'none':
                    break
            }
        }
        const result = [
            username,
            telegramInfo.first_name,
            telegramInfo.last_name,
            addUserId ? telegramInfo.id : null,
        ].compact.join(separator)
        return result.isNotEmpty ? result : telegramInfo.id.toString()
    }

    export function createNewTopicCreationNotificationString(
        user: UserProfile.BaseType,
        newTopicInfo: UserProfile.TelegramTopic.BaseType
    ) {
        const telegramTopicHistory = user.telegramTopicHistory
        const dialogLink = UserProfile.Helper.getForumDialogLink(newTopicInfo)
        let topicsInfoString = `Был создан новый топик в форуме ${newTopicInfo?.topicId}\nссылка: ${dialogLink}\n\n`

        const mainTopicLink = UserProfile.Helper.getForumDialogLink(user.telegramTopic)
        topicsInfoString += `Основной топик: ${user.telegramTopic?.topicId} ${mainTopicLink} ${user.telegramTopic?.creationDate?.formattedWithAppTimeZone()}\n\n`

        topicsInfoString += `История топиков этого пользователя:\n`
        topicsInfoString += telegramTopicHistory.isEmpty
            ? `История пуста, это первый топик данного пользователя`
            : telegramTopicHistory
                  .map((topic, index) => {
                      const link = UserProfile.Helper.getForumDialogLink(topic)
                      return `${index + 1}. ${topic.topicId} ${link} ${topic.creationDate?.formattedWithAppTimeZone()}`
                  })
                  .join(`\n`)
        return topicsInfoString
    }

    export function createTopicsInfoString(user: UserProfileDocument) {
        let topicsInfoString = ''

        const mainTopicLink = UserProfile.Helper.getForumDialogLink(user.telegramTopic)
        topicsInfoString += `Основной топик: ${user.telegramTopic?.topicId} ${mainTopicLink} ${user.telegramTopic?.creationDate?.formattedWithAppTimeZone()}\n\n`

        const telegramTopicHistory = user.telegramTopicHistory
        topicsInfoString += `История топиков этого пользователя:\n`
        topicsInfoString += telegramTopicHistory.isEmpty
            ? `История пуста, это первый топик данного пользователя`
            : telegramTopicHistory
                  .map((topic, index) => {
                      const link = UserProfile.Helper.getForumDialogLink(topic)
                      return `${index + 1}. ${topic.topicId} ${link} ${topic.creationDate?.formattedWithAppTimeZone()}`
                  })
                  .join(`\n`)
        return topicsInfoString
    }
}

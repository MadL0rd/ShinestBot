import { TelegramError } from 'telegraf'

type SendMessageError =
    | ((
          | { type: 'botWasBlockedByUser' }
          | { type: 'tooManyRequests'; timeoutSec: number }
          | { type: 'messageThreadNotFound' }
          | { type: 'messageToForwardNotFound' }
          | { type: 'messageIsNotModified' }
          | { type: 'userIsDeactivated' }
      ) & { error: TelegramError })
    | { error: unknown; type: undefined }

export function getSendMessageErrorType(error: unknown): SendMessageError {
    if (error instanceof AggregateError && error.errors.isNotEmpty) {
        error = error.errors.find((e) => e instanceof TelegramError)
    }
    if (!(error instanceof TelegramError)) return { error, type: undefined }

    if (error.message === '403: Forbidden: bot was blocked by the user')
        return { error, type: 'botWasBlockedByUser' }

    if (error.message.includes('Too Many Requests')) {
        const timeout = Number.parseInt(error.message.split(' ').last ?? '')
        return { error, type: 'tooManyRequests', timeoutSec: timeout ? timeout : 0 }
    }

    if (error.message.includes('message thread not found')) {
        return { error, type: 'messageThreadNotFound' }
    }

    if (
        error.message.includes('400: Bad Request: message to forward not found') ||
        error.message.includes(`400: Bad Request: messages can't be forwarded`) ||
        error.message.includes('400: Bad Request: there are no messages to forward')
    ) {
        return { error, type: 'messageToForwardNotFound' }
    }

    if (error.message.includes('400: Bad Request: message is not modified')) {
        return { error, type: 'messageIsNotModified' }
    }

    if (error.message.includes('403: Forbidden: user is deactivated')) {
        return { error, type: 'userIsDeactivated' }
    }

    return { error, type: undefined }
}

export function getChatMessageLink(args: { chatId: number; messageId: number }): string {
    return `https://t.me/c/${args.chatId}/${args.messageId}`.replace('-100', '')
}

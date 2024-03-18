export function replaceMarkdownWithHtml(text: string): string {
    // Bold text
    let isOpeningTag = true
    while (text.includes('*')) {
        text = text.replace('*', isOpeningTag ? '<b>' : '</b>')
        isOpeningTag = !isOpeningTag
    }

    // Markdown links to HTML links
    const regexMdLinks = /\[([^\]]+)\][^\)]+\)/g
    const singleMatch = /\[([^\[]+)\]\((.*)\)/

    const matches = text.match(regexMdLinks)

    if (matches) {
        for (const match of matches) {
            const markdownLinkComponents = singleMatch.exec(match)
            if (markdownLinkComponents) {
                const markdownLinkText = markdownLinkComponents[0]
                const publicText = markdownLinkComponents[1]
                const linkUrl = markdownLinkComponents[2]
                text = text.replace(markdownLinkText, `<a href="${linkUrl}">${publicText}</a>`)
            }
        }
    }

    return text
}

namespace HtmlMessageTags {
    export type union = (typeof allCases)[number]
    export const allCases = [
        'b', // bold
        'i', // italic
        'code', // code
        's', // strike
        'u', // underline
    ] as const
}

export function validateStringHtmlTagsAll(text: string) {
    HtmlMessageTags.allCases.forEach((tag) => validateStringHtmlTag(text, tag))
}

export function validateStringHtmlTag(text: string, tag: HtmlMessageTags.union) {
    const regExpOpen = RegExp(`<${tag}>`, 'g')
    const countOpen = (text.match(regExpOpen) || []).length

    const regExpClose = RegExp(`</${tag}>`, 'g')
    const countClose = (text.match(regExpClose) || []).length

    if (countOpen > countClose) {
        throw Error(
            `Text check fails! Tag <${tag}> opened and need to be closed with </${tag}>\nText: ${text}`
        )
    }
    if (countOpen < countClose) {
        throw Error(
            `Text check fails! Tag </${tag}> closed, but not opened with <${tag}>\nText: ${text}`
        )
    }
}

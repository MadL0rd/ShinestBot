export function replaceMarkdownWithHtml(inputString: string): string {
    let line = inputString

    // Bold text
    let isOpeningTag = true
    while (line.includes('*')) {
        line = line.replace('*', isOpeningTag ? '<b>' : '</b>')
        isOpeningTag = !isOpeningTag
    }

    // Markdown links to HTML links
    const regexMdLinks = /\[([^\]]+)\][^\)]+\)/g
    const singleMatch = /\[([^\[]+)\]\((.*)\)/

    const matches = line.match(regexMdLinks)

    if (matches) {
        for (const match of matches) {
            const markdownLinkComponents = singleMatch.exec(match)
            if (markdownLinkComponents) {
                const markdownLinkText = markdownLinkComponents[0]
                const publicText = markdownLinkComponents[1]
                const linkUrl = markdownLinkComponents[2]
                line = line.replace(markdownLinkText, `<a href="${linkUrl}">${publicText}</a>`)
            }
        }
    }

    return line
}

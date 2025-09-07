export function separateWordComponents(name: string): string[] {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter((word) => word.length > 1)
}

export function caseTitle(word: string) {
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
}

export function casePascal(name: string): string {
    if (!name) return name
    return separateWordComponents(name)
        .map((word) => caseTitle(word))
        .join('')
}

export function caseCamel(name: string): string {
    if (!name) return name
    return separateWordComponents(name)
        .map((word, index) => (index === 0 ? word : caseTitle(word)))
        .join('')
}

export function caseKebab(name: string) {
    if (!name) return name
    return separateWordComponents(name).join('-')
}

export function caseUpperUnderscore(name: string) {
    if (!name) return name
    return separateWordComponents(name)
        .map((word) => word.toUpperCase())
        .join('_')
}

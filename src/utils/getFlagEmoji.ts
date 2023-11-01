export function getFlagEmoji(countryCode: string) {
    if (countryCode == 'EN') return '🇬🇧'
    const codePoints = countryCode.upperCased.split('').map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
}

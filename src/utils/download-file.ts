import { writeFile } from 'fs/promises'
import { logger } from 'src/app/app.logger'

export async function downloadFile(fileDescriptor: {
    uriFile: string
    fileName: string
}): Promise<string | null> {
    const responseBody = await fetch(fileDescriptor.uriFile)
        .then((res) => res.body)
        .catch((error) => {
            logger.error(`Error fetch: ${error}`)
            return null
        })

    if (responseBody) {
        const fileName = `filesBuff/${fileDescriptor.fileName}`
        await writeFile(fileName, responseBody).catch((error) => {
            logger.error(`Error save: ${error}`)
        })
        return `filesBuff/${fileDescriptor.fileName}`
    }
    return null
}

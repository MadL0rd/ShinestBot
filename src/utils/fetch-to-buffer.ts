import { logger } from 'src/app/app.logger'

export async function fetchToBuffer(url: URL): Promise<Buffer | undefined> {
    return await fetch(url)
        .then(async (response) => {
            return response.ok ? Buffer.from(await response.arrayBuffer()) : undefined
        })
        .catch((error) => {
            logger.error(error)
            return undefined
        })
}

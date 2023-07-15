import axios from 'axios'
import { createWriteStream } from 'fs'
import { join } from 'path'

export const download = async (url: string, name?: string): Promise<string> => {
  const response = await axios.get(url, { responseType: 'stream' })

  const path = join(
    __dirname,
    '..',
    '..',
    'data',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    name || url.split('/').pop()!
  )

  const writer = createWriteStream(path)

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(path))
    writer.on('error', reject)
  })
}

import { download } from './download'
import archiver from 'archiver'
import { createReadStream, createWriteStream } from 'fs'
import { join, parse } from 'path'
import unzipper from 'unzipper'

export const zip = async (emojis: EmojiType[], name: string) => {
  const archive = archiver('zip', { zlib: { level: 9 } })

  const path = join(__dirname, '..', '..', 'data', `${name}.zip`)
  const output = createWriteStream(path)

  archive.pipe(output)

  for (const emoji of emojis) {
    const path = await download(
      emoji.url,
      `${emoji.name}.${emoji.url.split('.').pop()}`
    )
    archive.file(path, { name: parse(path).base })
  }

  await archive.finalize()

  return join(path)
}

export const unzip = async (path: string): Promise<string[]> => {
  const files: string[] = []

  return new Promise((resolve, reject) => {
    createReadStream(path)
      .pipe(unzipper.Parse())
      .on('entry', (entry: unzipper.Entry) => {
        const file = join(__dirname, '..', '..', 'data', entry.path)

        const type = entry.type
        if (type === 'File') {
          files.push(file)
          entry.pipe(createWriteStream(file))
        } else {
          entry.autodrain()
        }
      })
      .on('finish', () => resolve(files))
      .on('error', reject)
  })
}

import type { Archiver } from 'archiver'
import archiver from 'archiver'
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { createReadStream, createWriteStream } from 'fs'
import { readdir, unlink } from 'fs/promises'
import { join, parse } from 'path'
import { Parse } from 'unzipper'
import type { Entry } from 'unzipper'

export default class Manager {
  private readonly session: AxiosInstance
  private readonly archiver: Archiver

  constructor() {
    this.session = axios.create({
      responseType: 'stream',
    })
    this.archiver = archiver('zip', { zlib: { level: 9 } })
  }

  async clean() {
    const files = await readdir(join(__dirname, '..', '..', 'data'))

    await Promise.all(
      files
        .filter((file) => file !== '.gitkeep')
        .map((file) => unlink(join(__dirname, '..', '..', 'data', file)))
    )
  }

  protected async _zip(files: string[], name: string): Promise<string> {
    const path = join(__dirname, '..', '..', 'data', `${name}.zip`)
    const output = createWriteStream(path)

    this.archiver.pipe(output)

    files.forEach((path) => {
      this.archiver.file(path, { name: parse(path).base })
    })

    await this.archiver.finalize()

    return join(path)
  }

  protected async _unzip(path: string): Promise<string[]> {
    const files: string[] = []

    return new Promise((resolve, reject) => {
      createReadStream(path)
        .pipe(Parse())
        .on('entry', (entry: Entry) => {
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

  protected async download(url: string, name?: string): Promise<string> {
    const response = await this.session.get(url, { responseType: 'stream' })

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
}

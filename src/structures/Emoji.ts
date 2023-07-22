import Manager from './Manager'

export default class EmojiManager extends Manager {
  async zip(emojis: EmojiType[], name: string): Promise<string> {
    const downloaded = await Promise.all(
      emojis.map((emoji) =>
        this.download(emoji.url, `${emoji.name}.${emoji.url.split('.').pop()}`)
      )
    )

    return this._zip(downloaded, name)
  }

  async unzip(url: string): Promise<string[]> {
    const zip = await this.download(url)

    return this._unzip(zip)
  }
}

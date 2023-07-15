import { clean, download, unzip, zip } from '../utils'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { readFileSync } from 'fs'
import { parse } from 'path'

export class Emoji extends Extension {
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'zip',
    description: 'Zip emoji',
  })
  async zip(i: ChatInputCommandInteraction) {
    if (!i.guild)
      return i.editReply('❌ This command is only available in guilds')

    await i.deferReply()

    const emojis = await i.guild.emojis.fetch()

    if (!emojis) return i.editReply('❌ No emoji found')

    const list = emojis.map((e) => ({
      name: e.name ?? 'unknown',
      url: e.url,
    }))

    const path = await zip(list, i.guild.id)

    await i.editReply({
      files: [path],
    })

    clean()
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'upload',
    description: 'Upload emoji',
  })
  async upload(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.Attachment,
      name: 'file',
      description: 'Emoji zip file',
      required: true,
    })
    _: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    if (!i.guild)
      return i.editReply('❌ This command is only available in guilds')

    await i.deferReply()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const path = await download(i.options.getAttachment('file')!.url)

    const files = await unzip(path)

    try {
      for (const file of files) {
        await i.guild.emojis.create({
          name: parse(file).name,
          attachment: readFileSync(file),
        })
      }
    } catch (e) {
      return i.editReply('❌ Failed to upload emoji (likely due to permission)')
    }

    await i.editReply('✅ Done')

    clean()
  }
}

export const setup = async () => new Emoji()

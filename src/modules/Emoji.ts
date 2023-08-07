import EmojiManager from '../structures/Emoji'
import EmojiSelect from '../structures/components/EmojiSelect'
import ZipConfirm from '../structures/components/ZipConfirm'
import { createComponentFilter } from '../utils/filter'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ComponentType,
} from 'discord.js'
import { readFileSync } from 'fs'
import { parse } from 'path'

export class Emoji extends Extension {
  private readonly manager: EmojiManager

  constructor() {
    super()

    this.manager = new EmojiManager()
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'zip',
    description: 'Zip emoji',
  })
  async zip(i: ChatInputCommandInteraction) {
    if (!i.guild) return i.reply('❌ This command is only available in guilds')

    await i.deferReply()

    const emojis = await i.guild.emojis.fetch()

    if (!emojis) return i.editReply('❌ No emojis found')

    if (emojis.size > 25) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const path = await this.manager.zip(
        emojis.map((e) => ({
          name: e.name ?? 'unknown',
          url: e.url,
        })),
        i.guild.id
      )

      await i.editReply({
        content: `✅ ${emojis.size} emojis zipped`,
        files: [path],
        components: [],
      })

      await this.manager.clean()

      return
    }

    const response = await i.editReply({
      content: '⏳ Select emojis to zip',
      components: [new EmojiSelect(emojis), new ZipConfirm()],
    })

    let selected: EmojiType[] = emojis.map((e) => ({
      name: e.name ?? 'unknown',
      url: e.url,
    }))

    response
      .createMessageComponentCollector({
        filter: createComponentFilter(i),
        componentType: ComponentType.StringSelect,
        time: 30 * 1000,
      })
      .on('collect', async (j) => {
        await j.deferUpdate()

        selected = j.values.map((v) => {
          const [name, url] = v.split(' ')
          return { name, url }
        })
      })
      .on('end', async () => {
        await i.editReply({ content: '❌ Timeout', components: [] })
      })

    response
      .createMessageComponentCollector({
        filter: createComponentFilter(i),
        componentType: ComponentType.Button,
      })
      .on('collect', async (j) => {
        switch (j.customId) {
          case 'zip': {
            await j.deferUpdate()

            await i.editReply({
              content: '⏳ Zipping...',
              components: [],
            })

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const path = await this.manager.zip(selected, i.guild!.id)

            await i.editReply({
              content: `✅ ${selected.length} emojis zipped`,
              files: [path],
              components: [],
            })

            await this.manager.clean()

            break
          }

          case 'cancel':
            await j.deferUpdate()

            await i.editReply({
              content: '❌ Canceled',
              components: [],
            })

            break
        }
      })
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
    if (!i.guild) return i.reply('❌ This command is only available in guilds')

    await i.deferReply()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const files = await this.manager.unzip(i.options.getAttachment('file')!.url)

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

    await this.manager.clean()
  }
}

export const setup = async () => new Emoji()

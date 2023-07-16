import { clean, download, unzip, zip } from '../utils'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import type { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js'
import { readFileSync } from 'fs'
import { parse } from 'path'

export class Emoji extends Extension {
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

    const response = await i.editReply({
      content: '⏳ Select emojis to zip',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('emoji')
            .setPlaceholder('Select emojis to zip')
            .setMaxValues(emojis.size)
            .setMinValues(1)
            .addOptions(
              emojis.map((e) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(e.name ?? 'unknown')
                  .setValue(`${e.name} ${e.url}`)
                  .setEmoji(e.id)
                  .setDefault(true)
              )
            )
        ),

        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('zip')
            .setLabel('Zip')
            .setEmoji('📦')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setEmoji('✖️')
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    })

    const filter = (j: StringSelectMenuInteraction | ButtonInteraction) =>
      j.user.id === i.user.id

    const selectCollector = response.createMessageComponentCollector({
      filter,
      componentType: ComponentType.StringSelect,
      time: 30 * 1000,
    })

    const buttonCollector = response.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
    })

    let selected: { name: string; url: string }[] = emojis.map((e) => ({
      name: e.name ?? 'unknown',
      url: e.url,
    }))

    selectCollector
      .on('collect', async (j: StringSelectMenuInteraction) => {
        await j.deferUpdate()

        selected = j.values.map((v) => {
          const [name, url] = v.split(' ')
          return { name, url }
        })
      })
      .on('end', async () => {
        await i.editReply({ content: '❌ Timeout', components: [] })
      })

    buttonCollector.on('collect', async (j: ButtonInteraction) => {
      if (j.customId === 'zip') {
        await j.deferUpdate()

        await i.editReply({
          content: '⏳ Zipping...',
          components: [],
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const path = await zip(selected, i.guild!.id)

        await i.editReply({
          content: `✅ ${selected.length} emojis zipped`,
          files: [path],
          components: [],
        })

        clean()
      } else if (j.customId === 'cancel') {
        await j.deferUpdate()

        await i.editReply({
          content: '❌ Cancelled',
          components: [],
        })
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

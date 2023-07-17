import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import type { Collection, GuildEmoji } from 'discord.js'

export default class EmojiSelect extends ActionRowBuilder<StringSelectMenuBuilder> {
  constructor(emojis: Collection<string, GuildEmoji>) {
    super()

    this.addComponents(
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
    )
  }
}

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export default class ZipConfirm extends ActionRowBuilder<ButtonBuilder> {
  constructor() {
    super()

    this.addComponents(
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
    )
  }
}

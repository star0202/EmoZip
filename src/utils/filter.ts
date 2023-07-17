import type {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
} from 'discord.js'

export const createComponentFilter =
  (i: ChatInputCommandInteraction) => (j: MessageComponentInteraction) =>
    j.user.id === i.user.id

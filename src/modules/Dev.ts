import {
  Extension,
  applicationCommand,
  listener,
  option,
  ownerOnly,
} from '@pikokr/command.ts'
import { blue, green, yellow } from 'chalk'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  codeBlock,
} from 'discord.js'
import type { Interaction } from 'discord.js'
import { basename, join } from 'path'

class Dev extends Extension {
  @listener({ event: 'applicationCommandInvokeError', emitter: 'cts' })
  async errorLogger(err: Error) {
    this.logger.error(err)
  }

  @listener({ event: 'interactionCreate' })
  async commandLogger(i: Interaction) {
    if (!i.isChatInputCommand()) return

    const options: string[] = []
    for (const option of i.options.data) {
      options.push(
        `\n- ${green(option.name)}: ${blue(option.value)} (${yellow(
          ApplicationCommandOptionType[option.type]
        )})`
      )
    }

    const guild = i.guild ? `${green(i.guild.name)}(${blue(i.guild.id)})` : 'DM'

    this.logger.info(
      `${green(i.user.tag)}(${blue(i.user.id)}) in ${guild}: ${yellow.bold(
        `/${i.commandName}`
      )}${options}`
    )
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'reload',
    description: '[OWNER] Reload all modules',
  })
  async reload(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.commandClient.registry.reloadModules().then((r) =>
      r.map((x) => ({
        path: basename(x.file),
        result: x.result,
        error: x.error?.message.normalize(),
      }))
    )

    let success = 0,
      fail = 0
    for (const x of data) {
      if (x.result) success++
      else fail++
    }

    await i.editReply(
      codeBlock(
        `✅ ${success} ❌ ${fail}\n` +
          data.map((x) => `${x.result ? '✅' : '❌'} ${x.path}`).join('\n')
      )
    )
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'load',
    description: '[OWNER] Load a module',
  })
  async load(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'module',
      description: 'Module name',
      required: true,
    })
    name: string
  ) {
    await i.deferReply()

    await this.commandClient.registry.loadModulesAtPath(
      join(__dirname, `${name}.ts`)
    )

    await i.editReply(codeBlock(`✅ ${name}.ts`))
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'unregister',
    description: '[OWNER] Unregister commands',
  })
  async unregister(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.Boolean,
      name: 'global',
      description: 'Global?',
      required: true,
    })
    global: boolean
  ) {
    await i.deferReply()

    if (global) this.client.application?.commands.set([])
    else i.guild?.commands.set([])

    await i.editReply('Done')
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'sync',
    description: '[OWNER] Sync commands',
  })
  async sync(i: ChatInputCommandInteraction) {
    await i.deferReply()

    await this.commandClient.getApplicationCommandsExtension()?.sync()

    await i.editReply('Done')
  }
}

export const setup = async () => new Dev()

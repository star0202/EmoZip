import z from 'zod'

const Config = z.object({
  token: z.string().regex(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g),
  guilds: z.array(z.string()).optional(),
  debug: z.boolean(),
})

// eslint-disable-next-line @typescript-eslint/no-var-requires
const configRaw = require('../config.json')
if (configRaw.guilds.length === 0) {
  delete configRaw.guilds
}

export const config = Config.parse(configRaw)

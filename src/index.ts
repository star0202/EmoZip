import { config } from './config'
import Client from './structures/Client'
import { getLogger } from './utils'

const client = new Client(getLogger('EmojiZip', config.debug ? 2 : 3))

;(async () => await client.start())()

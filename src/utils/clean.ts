import { readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

export const clean = () => {
  readdirSync(join(__dirname, '..', '..', 'data')).forEach((file) => {
    if (file !== '.gitkeep') {
      unlinkSync(join(__dirname, '..', '..', 'data', file))
    }
  })
}

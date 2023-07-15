import { Logger } from 'tslog'

export const getLogger = (name: string, level?: number) =>
  new Logger({
    name: name,
    prettyLogTemplate:
      '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{name}}]\t',
    prettyLogTimeZone: 'local',
    minLevel: level || 3,
  })

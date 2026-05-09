import pino from 'pino'

const transport =
  process.env.NODE_ENV === 'production'
    ? undefined
    : pino.transport({ target: 'pino-pretty', options: { colorize: true, singleLine: true } })

export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, transport)

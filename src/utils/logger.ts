import pino, { type LoggerOptions} from "pino"
//
import { NODE_ENV } from "../config.js"


const config =  {
  dev: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  } as LoggerOptions,
  prod: {
    level: 'info',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    transport: {
      target: 'pino/file',
      options: {
        destination: './app.log',
        mkdir: true
      }
    },
    redact: {
      paths: ['password', 'roles', 'token', "credit"],
      remove: true // omit fields entirely
      // censor: '**' // only censor them
    }
  } as LoggerOptions
}

export const logger = pino(config[NODE_ENV])

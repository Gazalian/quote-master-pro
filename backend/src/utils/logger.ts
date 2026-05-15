import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

const isDev = env.NODE_ENV === 'development';

/**
 * Pino options. Fastify constructs its own pino instance from this — passing
 * the instance directly causes a TS type mismatch between pino@9 and fastify@4.
 */
export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            '*.password',
            '*.token',
            'GEMINI_API_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
          ],
          censor: '[REDACTED]',
        },
      }),
};

/** Standalone logger for use outside Fastify (e.g. services, startup). */
export const logger = pino(loggerOptions);

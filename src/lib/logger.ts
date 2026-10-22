import pino from 'pino';
import { config } from '@/lib/config';

export const REDACT_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  '*.password',
  '*.passwordHash',
  '*.password_hash',
  'apiKey',
  'api_key',
  '*.apiKey',
  '*.api_key',
  'secret',
  '*.secret',
  'token',
  '*.token',
  'authorization',
  '*.authorization',
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'credential',
  '*.credential',
  'databaseUrl',
  '*.databaseUrl',
];

const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: REDACT_KEYS,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req: any) => {
      if (!req) return req;
      const headers = { ...req.headers };
      if (headers.authorization) headers.authorization = '[REDACTED]';
      if (headers['x-api-key']) headers['x-api-key'] = '[REDACTED]';
      if (headers.cookie) headers.cookie = '[REDACTED]';
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        headers,
      };
    },
  },
};

export const logger =
  config.NODE_ENV === 'development'
    ? pino(
        pinoOptions,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }),
      )
    : pino(pinoOptions);

export default logger;

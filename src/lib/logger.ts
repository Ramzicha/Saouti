import pino from 'pino';
import pinoHttp from 'pino-http';
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
  'encryptedKey',
  '*.encryptedKey',
  'encrypted_key',
  '*.encrypted_key',
  'geminiKey',
  '*.geminiKey',
  'gemini_key',
  '*.gemini_key',
  'authTag',
  '*.authTag',
  'auth_tag',
  '*.auth_tag',
  'nonce',
  '*.nonce',
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
    req: (req: unknown) => {
      if (!req || typeof req !== 'object') return req;
      const requestObj = req as Record<string, unknown>;
      const rawHeaders =
        requestObj.headers && typeof requestObj.headers === 'object'
          ? (requestObj.headers as Record<string, unknown>)
          : {};
      const headers = { ...rawHeaders };
      if (headers.authorization) headers.authorization = '[REDACTED]';
      if (headers['x-api-key']) headers['x-api-key'] = '[REDACTED]';
      if (headers.cookie) headers.cookie = '[REDACTED]';
      return {
        id: requestObj.id,
        method: requestObj.method,
        url: requestObj.url,
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

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) =>
    (req.headers['x-request-id'] as string) || crypto.randomUUID(),
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
});

export default logger;

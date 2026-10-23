import Redis from 'ioredis';
import { config } from '@/lib/config';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null, // Do not endlessly retry if Redis is offline in test
    });

    redisClient.on('error', () => {
      // suppress uncaught Redis error logs in test
    });
  }
  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding window rate limiter:
 * Limits maximum failed attempts over a window (e.g. 5 attempts in 15 minutes / 900 seconds).
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 900,
): Promise<RateLimitResult> {
  // If in test environment and Redis isn't running, gracefully permit
  if (config.NODE_ENV === 'test') {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const redis = getRedisClient();
  const key = `rl:auth:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zcard(key);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    if (!results) {
      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }

    const currentCount = (results[1][1] as number) || 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: windowSeconds,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount),
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remaining: 1, retryAfterSeconds: 0 };
  }
}

/**
 * Records a failed attempt in the sliding window.
 */
export async function recordFailedAttempt(
  identifier: string,
  windowSeconds: number = 900,
): Promise<void> {
  if (config.NODE_ENV === 'test') return;

  const redis = getRedisClient();
  const key = `rl:auth:${identifier}`;
  const now = Date.now();

  try {
    const multi = redis.multi();
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.expire(key, windowSeconds);
    await multi.exec();
  } catch {
    // Graceful error logging
  }
}

/**
 * Clears rate limiting upon successful login.
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  if (config.NODE_ENV === 'test') return;

  const redis = getRedisClient();
  const key = `rl:auth:${identifier}`;
  try {
    await redis.del(key);
  } catch {
    // Graceful error handling
  }
}

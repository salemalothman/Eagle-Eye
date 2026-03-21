import Redis from 'ioredis';
import { config } from '../config.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redis, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 500, 3000);
      },
      lazyConnect: true,
    });

    let errorLogged = false;
    redis.on('error', (err) => {
      if (!errorLogged) {
        console.warn('[Redis] Connection error:', err.message);
        errorLogged = true;
      }
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    const r = getRedis();
    await Promise.race([
      r.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
    ]);
  } catch (err: any) {
    console.warn('[Redis] Could not connect:', err.message, '- running without cache');
  }
}

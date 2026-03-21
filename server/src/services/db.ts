import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database,
      max: 10,
      idleTimeoutMillis: 30_000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
    });
  }
  return pool;
}

export async function connectDb(): Promise<void> {
  try {
    const p = getPool();
    const client = await Promise.race([
      p.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
    ]);
    console.log('[DB] Connected to TimescaleDB');
    client.release();
  } catch (err: any) {
    console.warn('[DB] Could not connect:', err.message, '- running without database');
  }
}

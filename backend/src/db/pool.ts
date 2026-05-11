import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  host: env.DB.host,
  port: env.DB.port,
  database: env.DB.name,
  user: env.DB.user,
  password: env.DB.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount || 0 };
}
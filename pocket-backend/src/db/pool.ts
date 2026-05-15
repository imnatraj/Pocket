// pool.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { getDbConfig } from './config.js';

const dbUrl = getDbConfig();

export const pool = mysql.createPool(dbUrl);

export async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}
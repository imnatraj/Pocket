import 'dotenv/config';
import mysql from 'mysql2/promise';

import { getDbConfig } from './config.js';

export const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

export async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}
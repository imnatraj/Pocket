import 'dotenv/config';
import mysql from 'mysql2/promise';

const isPlaceholder = (val?: string) => !val || val.startsWith('${{') || val.includes('${');

const getPoolConfig = () => {
  const url = process.env.DATABASE_URL;

  // If DATABASE_URL is present and NOT a placeholder, use it
  if (url && !isPlaceholder(url)) {
    return {
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
    };
  }

  // Fallback to individual variables
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pocket',
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
  };
};

export const pool = mysql.createPool(getPoolConfig());

export async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}
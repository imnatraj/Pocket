// pool.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { getDbConfig } from './config.js';

const dbType = process.env.DB_TYPE || 'mysql'; // 'mysql' or 'supabase'

let mysqlPool: mysql.Pool;
let pgPool: pg.Pool;

if (dbType === 'mysql') {
  mysqlPool = mysql.createPool({
    uri: getDbConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
} else {
  pgPool = new pg.Pool({
    connectionString: getDbConfig(),
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });
}

// Unified Database Adapter Wrapper
export const pool = {
  getConnection: async () => {
    if (dbType === 'mysql') {
      const conn = await mysqlPool.getConnection();
      return {
        query: (sql: string, params?: any[]) => conn.query(sql, params),
        beginTransaction: () => conn.beginTransaction(),
        commit: () => conn.commit(),
        rollback: () => conn.rollback(),
        release: () => conn.release(),
      };
    } else {
      const client = await pgPool.connect();
      return {
        query: async (sql: string, params?: any[]) => {
          // Convert MySQL `?` placeholders to Postgres `$1`, `$2` dynamically
          let i = 1;
          const pgSql = sql.replace(/\?/g, () => `$${i++}`);
          const result = await client.query(pgSql, params);
          return [result.rows, result.fields] as any;
        },
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
      };
    }
  },
  query: async (sql: string, params?: any[]) => {
    if (dbType === 'mysql') {
      return mysqlPool.query(sql, params);
    } else {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const result = await pgPool.query(pgSql, params);
      return [result.rows, result.fields] as any;
    }
  }
};

export async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}
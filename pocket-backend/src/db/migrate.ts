import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { getDbConfig } from './config.js';

async function run() {
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  let sql = fs.readFileSync(schemaPath, 'utf8');
  const dbType = process.env.DB_TYPE || 'mysql';

  console.log(`Running migrations for ${dbType}...`);

  if (dbType === 'supabase') {
    // Supabase (PostgreSQL) execution
    const client = new pg.Client({
      connectionString: getDbConfig(),
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      await client.query(sql);
      console.log('✔ Supabase (PostgreSQL) Migration completed');
    } finally {
      await client.end();
    }
  } else {
    // MySQL execution
    // MySQL requires backticks for reserved words by default and doesn't natively support IF NOT EXISTS on indexes
    const mysqlSql = sql
      .replace(/"limit"/g, '`limit`')
      .replace(/CREATE INDEX IF NOT EXISTS/g, 'CREATE INDEX');

    const conn = await mysql.createConnection({
      uri: getDbConfig(),
      multipleStatements: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    try {
      await conn.query(mysqlSql);
      console.log('✔ MySQL Migration completed');
    } finally {
      await conn.end();
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
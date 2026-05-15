// src/db/migrate.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const isPlaceholder = (val?: string) =>
  !val || val.startsWith('${{') || val.includes('${');

const getDbUrl = (): string => {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url || isPlaceholder(url)) {
    throw new Error('DATABASE_URL / MYSQL_URL is required');
  }

  return url;
};

async function run() {
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    uri: getDbUrl(),
    multipleStatements: true,
  });

  try {
    console.log('Running migrations...');
    await conn.query(sql);
    console.log('✔ Migration completed');
  } finally {
    await conn.end();
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
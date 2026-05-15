import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { getDbConfig } from './config.js';

async function run() {
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  // ✅ FIX: pass STRING directly
  const conn = await mysql.createConnection(getDbConfig());

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
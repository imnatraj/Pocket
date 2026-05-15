import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

import { getDbConfig } from './config.js';

const sql = fs.readFileSync(path.join(process.cwd(), 'sql', 'schema.sql'), 'utf8');

const run = async () => {
  const conn = await mysql.createConnection({
    ...getDbConfig(),
    multipleStatements: true,
  });

  console.log('Running migrations…');
  await conn.query(sql);
  console.log('✔ Schema ready');
  await conn.end();
  process.exit(0);
};

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
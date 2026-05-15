// config.ts
import 'dotenv/config';

export const getDbConfig = (): string => {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  return url;
};
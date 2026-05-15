// config/db.ts
import 'dotenv/config';

const isPlaceholder = (val?: string) =>
  !val || val.startsWith('${{') || val.includes('${');

export const getDbConfig = () => {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url || isPlaceholder(url)) {
    throw new Error('DATABASE_URL / MYSQL_URL is required for Railway deployment');
  }

  return {
    uri: url,
  };
};
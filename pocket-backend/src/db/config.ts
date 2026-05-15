import 'dotenv/config';

const isPlaceholder = (val?: string) => !val || val.startsWith('${{') || val.includes('${');

export const getDbConfig = () => {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  // If URL is present and NOT a placeholder, use it
  if (url && !isPlaceholder(url)) {
    return {
      uri: url,
    };
  }

  // Fallback to individual variables
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pocket',
  };
};

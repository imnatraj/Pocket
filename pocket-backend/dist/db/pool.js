import 'dotenv/config';
import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pocket',
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true, // Returns DECIMAL as string or number depending on size
});
export async function ping() {
    const conn = await pool.getConnection();
    try {
        await conn.query('SELECT 1');
    }
    finally {
        conn.release();
    }
}

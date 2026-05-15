import 'dotenv/config';
import mysql from 'mysql2/promise';
export declare const pool: mysql.Pool;
export declare function ping(): Promise<void>;

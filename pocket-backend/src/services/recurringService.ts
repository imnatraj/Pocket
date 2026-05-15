import { pool } from '../db/pool.js';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';

export async function processRecurringTransactions() {
  console.log('Processing recurring transactions…');
  try {
    const now = dayjs().utc();
    const [rows] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE is_active = TRUE AND next_date <= ?',
      [now.toISOString()]
    );

    const recurring = rows as any[];
    for (const r of recurring) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Create the transaction (no account association)
        const txId = crypto.randomUUID();
        await connection.query(
          'INSERT INTO transactions (id, user_id, title, amount, type, category_id, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
          [txId, r.user_id, r.title, r.amount, r.type, r.category_id, r.next_date]
        );

        // Calculate next date
        let nextDate = dayjs(r.next_date);
        switch (r.frequency) {
          case 'daily': nextDate = nextDate.add(1, 'day'); break;
          case 'weekly': nextDate = nextDate.add(1, 'week'); break;
          case 'monthly': nextDate = nextDate.add(1, 'month'); break;
          case 'yearly': nextDate = nextDate.add(1, 'year'); break;
        }

        await connection.query(
          'UPDATE recurring_transactions SET next_date = ? WHERE id = ?',
          [nextDate.toISOString(), r.id]
        );

        await connection.commit();
        console.log(`✔ Processed recurring tx: ${r.title} for user ${r.user_id}`);
      } catch (e) {
        await connection.rollback();
        console.error(`Failed to process recurring tx ${r.id}:`, e);
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Recurring processing failed:', error);
  }
}

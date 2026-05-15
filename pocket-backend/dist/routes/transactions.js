import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { auth } from '../middleware/auth.js';
import { toUTC } from '../utils/date.js';
import { Decimal } from 'decimal.js';
const router = Router();
const txSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1),
    amount: z.number().positive().or(z.string().transform(v => new Decimal(v).toNumber())),
    type: z.enum(['income', 'expense']),
    categoryId: z.string().min(1),
    date: z.string(),
    note: z.string().optional().nullable(),
    receipt: z.string().optional().nullable(),
});
const rowToTx = (r) => ({
    id: r.id,
    title: r.title,
    amount: new Decimal(r.amount).toNumber(),
    type: r.type,
    categoryId: r.category_id,
    date: r.date,
    note: r.note,
    receipt: r.receipt,
    createdAt: r.created_at,
});
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
        res.json(rows.map(rowToTx));
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
router.post('/', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const data = txSchema.parse(req.body);
        const id = data.id || uuid();
        const amount = new Decimal(data.amount).toFixed(2);
        const date = toUTC(data.date);
        await connection.beginTransaction();
        // Insert transaction (no account association)
        await connection.query(`INSERT INTO transactions (id, user_id, title, amount, type, category_id, date, note, receipt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, req.user.id, data.title, amount, data.type, data.categoryId, date, data.note ?? null, data.receipt ?? null]);
        await connection.commit();
        res.status(201).json({ id });
    }
    catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(400).json({ error: 'Failed to create transaction' });
    }
    finally {
        connection.release();
    }
});
router.patch('/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const patch = txSchema.partial().parse(req.body);
        await connection.beginTransaction();
        // Fetch existing tx
        const [rows] = await connection.query('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        const old = rows[0];
        if (!old)
            throw new Error('Transaction not found');
        // Prepare updates
        const fields = [];
        const values = [];
        const map = {
            title: 'title', amount: 'amount', type: 'type', categoryId: 'category_id', date: 'date', note: 'note', receipt: 'receipt'
        };
        for (const [k, col] of Object.entries(map)) {
            const val = patch[k];
            if (val !== undefined) {
                fields.push(`${col} = ?`);
                if (k === 'date')
                    values.push(toUTC(val));
                else if (k === 'amount')
                    values.push(new Decimal(val).toFixed(2));
                else
                    values.push(val);
            }
        }
        if (fields.length) {
            values.push(req.params.id, req.user.id);
            await connection.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
        }
        // No account balances to update after editing
        await connection.commit();
        res.json({ ok: true });
    }
    catch (e) {
        await connection.rollback();
        res.status(400).json({ error: 'Failed to update transaction' });
    }
    finally {
        connection.release();
    }
});
router.delete('/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        const tx = rows[0];
        if (tx) {
            await connection.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
        }
        await connection.commit();
        res.json({ ok: true });
    }
    catch (e) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
    finally {
        connection.release();
    }
});
export default router;

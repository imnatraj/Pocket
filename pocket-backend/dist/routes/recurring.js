import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { auth } from '../middleware/auth.js';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';
const router = Router();
const recurringSchema = z.object({
    title: z.string().min(1).max(255),
    amount: z.number().or(z.string()),
    type: z.enum(['income', 'expense']),
    categoryId: z.string().uuid(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: z.string(),
});
// GET /recurring
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM recurring_transactions WHERE user_id = ?', [req.user.id]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }
});
// POST /recurring
router.post('/', auth, async (req, res) => {
    try {
        const data = recurringSchema.parse(req.body);
        const id = crypto.randomUUID();
        const amount = new Decimal(data.amount).toFixed(2);
        const startDate = dayjs(data.startDate).utc().startOf('day');
        const nextDate = startDate.toISOString();
        await pool.query('INSERT INTO recurring_transactions (id, user_id, title, amount, type, category_id, frequency, start_date, next_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, req.user.id, data.title, amount, data.type, data.categoryId, data.frequency, startDate.toISOString(), nextDate]);
        res.status(201).json({ id, ...data, amount, nextDate });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create recurring transaction' });
    }
});
// DELETE /recurring/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }
});
export default router;

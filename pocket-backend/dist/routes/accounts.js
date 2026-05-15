import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { auth } from '../middleware/auth.js';
import { Decimal } from 'decimal.js';
const router = Router();
const accountSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['bank', 'cash', 'credit', 'investment', 'other']),
    balance: z.number().or(z.string()),
    currency: z.string().min(3).max(8).default('INR'),
    color: z.string().optional(),
    icon: z.string().optional(),
    isDefault: z.boolean().optional(),
});
// GET /accounts
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM accounts WHERE user_id = ? ORDER BY is_default DESC, name ASC', [req.user.id]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
// POST /accounts
router.post('/', auth, async (req, res) => {
    try {
        const data = accountSchema.parse(req.body);
        const id = crypto.randomUUID();
        const balance = new Decimal(data.balance).toFixed(2);
        // If this is default, unset others
        if (data.isDefault) {
            await pool.query('UPDATE accounts SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
        }
        await pool.query('INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, req.user.id, data.name, data.type, balance, data.currency, data.color, data.icon, data.isDefault || false]);
        res.status(201).json({ id, ...data, balance });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});
// PATCH /accounts/:id
router.patch('/:id', auth, async (req, res) => {
    try {
        const data = accountSchema.partial().parse(req.body);
        const updates = [];
        const values = [];
        if (data.isDefault) {
            await pool.query('UPDATE accounts SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
        }
        for (const [key, value] of Object.entries(data)) {
            const dbKey = key === 'isDefault' ? 'is_default' : key;
            updates.push(`${dbKey} = ?`);
            values.push(key === 'balance' ? new Decimal(value).toFixed(2) : value);
        }
        if (updates.length === 0)
            return res.status(400).json({ error: 'No updates provided' });
        values.push(req.params.id, req.user.id);
        await pool.query(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update account' });
    }
});
// DELETE /accounts/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM accounts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
export default router;

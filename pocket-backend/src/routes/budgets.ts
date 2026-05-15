import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { auth } from '../middleware/auth.js';
import { Decimal } from 'decimal.js';

const router = Router();

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  limit: z.number().nonnegative().or(z.string().transform(v => new Decimal(v).toNumber())),
});

router.get(
  '/',
  auth,
  async (req: Request, res: Response) => {
    try {
      const [rows] = (await pool.query(
        'SELECT category_id, `limit` FROM budgets WHERE user_id = ?',
        [req.user!.id]
      )) as any[];
      res.json(
        rows.map((r: any) => ({
          categoryId: r.category_id,
          limit: new Decimal(r.limit).toNumber(),
        }))
      );
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch budgets' });
    }
  }
);

router.put(
  '/',
  auth,
  async (req: Request, res: Response) => {
    try {
      const { categoryId, limit } = budgetSchema.parse(req.body);
      await pool.query(
        'INSERT INTO budgets (user_id, category_id, `limit`) VALUES (?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE `limit` = VALUES(`limit`)',
        [req.user!.id, categoryId, new Decimal(limit).toFixed(2)]
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: 'Failed to set budget' });
    }
  }
);

router.delete(
  '/:categoryId',
  auth,
  async (req: Request, res: Response) => {
    try {
      await pool.query('DELETE FROM budgets WHERE user_id = ? AND category_id = ?', [
        req.user!.id,
        req.params.categoryId,
      ]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete budget' });
    }
  }
);

router.delete(
  '/',
  auth,
  async (req: Request, res: Response) => {
    try {
      await pool.query('DELETE FROM budgets WHERE user_id = ?', [req.user!.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to reset budgets' });
    }
  }
);

// Reports: monthly income/expense aggregates (IST-aware)
router.get(
  '/reports/monthly',
  auth,
  async (req: Request, res: Response) => {
    try {
      // Grouping by IST month
      const [rows] = (await pool.query(
        `SELECT DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+05:30'), '%Y-%m') AS month,
                SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
         FROM transactions WHERE user_id = ?
         GROUP BY month ORDER BY month DESC LIMIT 12`,
        [req.user!.id]
      )) as any[];

      res.json(
        rows.map((r: any) => ({
          month: r.month,
          income: new Decimal(r.income || 0).toNumber(),
          expense: new Decimal(r.expense || 0).toNumber(),
        }))
      );
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

export default router;

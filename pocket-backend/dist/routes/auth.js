import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { signToken, auth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
const router = Router();
const credSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1).max(120).optional(),
});
router.post('/signup', asyncH(async (req, res) => {
    const { email, password, displayName } = credSchema.parse(req.body);
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    const existing = rows;
    if (existing.length) {
        return res.status(409).json({ message: 'Email already registered' });
    }
    const id = uuid();
    const hash = await bcrypt.hash(password, 10);
    const name = displayName || email.split('@')[0];
    await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)', [id, email, hash, name]);
    const token = signToken({ sub: id, email });
    res.status(201).json({ token, user: { id, email, displayName: name } });
}));
router.post('/login', asyncH(async (req, res) => {
    const { email, password } = credSchema
        .pick({ email: true, password: true })
        .parse(req.body);
    const [rows] = await pool.query('SELECT id, email, password_hash, display_name FROM users WHERE email = ? LIMIT 1', [email]);
    const users = rows;
    if (!users.length) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const u = users[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken({ sub: u.id, email: u.email });
    res.json({
        token,
        user: { id: u.id, email: u.email, displayName: u.display_name },
    });
}));
router.get('/me', auth, asyncH(async (req, res) => {
    const [rows] = await pool.query('SELECT id, email, display_name, currency FROM users WHERE id = ?', [req.user.id]);
    const users = rows;
    if (!users.length) {
        return res.status(404).json({ message: 'User not found' });
    }
    const u = users[0];
    res.json({
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        currency: u.currency,
    });
}));
export default router;

import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { ping } from './db/pool.js';

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import recurringRoutes from './routes/recurring.js';

import { errorHandler } from './middleware/error.js';

const app = express();

/* ---------------- TRUST PROXY (RAILWAY) ---------------- */
app.set('trust proxy', 1);

/* ---------------- CORS ---------------- */

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((o) => o.trim());

    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* ---------------- SECURITY ---------------- */

app.use(helmet());

/* ---------------- RATE LIMIT ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/* ---------------- BODY PARSER ---------------- */

app.use(express.json({ limit: '5mb' }));

/* ---------------- HEALTH CHECK ---------------- */

app.get('/health', async (_req, res) => {
  try {
    await ping();

    return res.json({
      ok: true,
      db: 'up',
      service: 'pocket-api',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('DB ERROR:', err);

    return res.status(500).json({
      ok: false,
      db: 'down',
      error: err.message,
    });
  }
});

/* ---------------- ROUTES ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);

/* ---------------- ERROR HANDLER ---------------- */

app.use(errorHandler);

/* ---------------- START SERVER ---------------- */

const PORT = Number(process.env.PORT || 4000);

console.log('DB_HOST:', process.env.DB_HOST);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ Pocket API running on port ${PORT}`);
  console.log(`✔ Health: /health`);
});
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
// app.set('trust proxy', 1);

/* ---------------- CORS ---------------- */

const corsOptions: CorsOptions = {
  origin: true, // This will reflect the request origin back to the client
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight for all paths



/* ---------------- SECURITY ---------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  })
);

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

/* ---------------- HEALTH CHECK & DEBUG ---------------- */

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

app.get('/api/debug-cors', (req, res) => {
  res.json({
    cors_origin_env: process.env.CORS_ORIGIN,
    allowed_origins: (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, '').replace(/^["']|["']$/g, '')),
    request_origin: req.headers.origin,
    trust_proxy: app.get('trust proxy'),
  });
});

/* ---------------- ROUTES ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);

/* ---------------- ERROR HANDLER ---------------- */

app.use(errorHandler);

// Global handlers for unexpected crashes
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

/* ---------------- START SERVER ---------------- */

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ Pocket API running on port ${PORT}`);
  console.log(`✔ Health: /health`);
});
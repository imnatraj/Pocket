import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ping } from './db/pool.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import recurringRoutes from './routes/recurring.js';
import { errorHandler } from './middleware/error.js';

const app = express();

/* ---------------- CORS ---------------- */

const corsOptions = {
  origin: (origin, cb) => {
    const origins = (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((s) => s.trim());

    if (!origin || origins.includes('*') || origins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* ---------------- Security ---------------- */

app.use(helmet());

/* ---------------- Rate Limit ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later',
});

app.use('/api/', limiter);

/* ---------------- Body Parser ---------------- */

app.use(express.json({ limit: '5mb' }));

/* ---------------- Health Check ---------------- */

app.get('/health', async (_req, res) => {
  try {
    await ping();
    res.json({
      ok: true,
      db: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('DB ERROR:', e);
    res.status(500).json({
      ok: false,
      db: 'down',
      error: e.message,
    });
  }
});

/* ---------------- Routes ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);

/* ---------------- Error Handler ---------------- */

app.use(errorHandler);

/* ---------------- Server Start ---------------- */

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ Pocket API running on port ${PORT}`);
  console.log(`✔ Health: /health`);
});

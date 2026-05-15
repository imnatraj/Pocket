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
import { processRecurringTransactions } from './services/recurringService.js';

const app = express();

// Start recurring processor (every minute)
// setInterval(processRecurringTransactions, 60 * 1000);
// Run once on start
// processRecurringTransactions();

// Security Headers
app.use(helmet());

// CORS
const origins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes('*') || origins.includes(origin)) return cb(null, true);
      cb(new Error('CORS blocked: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  })
);
app.options('*', cors({
  origin: (origin, cb) => {
    if (!origin || origins.includes('*') || origins.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '5mb' }));

// Health Check
app.get('/health', async (_req, res) => {
  try {
    await ping();
    res.json({ ok: true, db: 'up', timestamp: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ ok: false, db: 'down', error: e.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

app.use('/api/recurring', recurringRoutes);

// Error Handling
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`✔ Pocket API listening on http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
});

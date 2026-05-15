# Pocket — Backend (Node.js + Express + MySQL)

REST API for the Pocket personal finance tracker. JWT auth, MySQL storage.

## Stack
- Node.js 18+ (ESM)
- Express 4
- MySQL 8 (via `mysql2`)
- JWT (`jsonwebtoken`) + bcrypt
- Validation with Zod

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# edit .env — set DB_PASSWORD, JWT_SECRET, CORS_ORIGIN

# 3. Create the database & schema
#    Option A: run the migration script (uses DB_* from .env)
npm run migrate
#    Option B: pipe schema.sql manually
#    mysql -u root -p < sql/schema.sql

# 4. Run the API
npm run dev          # http://localhost:4000
```

Health check: `curl http://localhost:4000/health`

## Endpoints

| Method | Path                          | Auth | Purpose                              |
|--------|-------------------------------|------|--------------------------------------|
| POST   | /api/auth/signup              | —    | Register `{email, password, displayName?}` |
| POST   | /api/auth/login               | —    | Login → `{ token, user }`            |
| GET    | /api/auth/me                  | ✓    | Current user                         |
| GET    | /api/transactions             | ✓    | List user's transactions             |
| POST   | /api/transactions             | ✓    | Create transaction                   |
| PATCH  | /api/transactions/:id         | ✓    | Update transaction                   |
| DELETE | /api/transactions/:id         | ✓    | Delete one transaction               |
| DELETE | /api/transactions             | ✓    | Delete ALL of user's transactions    |
| GET    | /api/budgets                  | ✓    | List budgets                         |
| PUT    | /api/budgets                  | ✓    | Upsert `{categoryId, limit}`         |
| DELETE | /api/budgets/:categoryId      | ✓    | Remove a budget                      |
| DELETE | /api/budgets                  | ✓    | Remove all budgets                   |
| GET    | /api/budgets/reports/monthly  | ✓    | Last 12 months income/expense        |

Auth header: `Authorization: Bearer <token>`

## Connect the frontend

In the Pocket frontend project, set:

```
VITE_API_URL=http://localhost:4000/api
```

Then restart the Vite dev server. Sign up → all data is now persisted in MySQL.

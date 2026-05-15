# Pocket - Personal Finance Management

Pocket is a personal finance management application used to track income, expenses, and financial activity.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- TypeORM
- MySQL

## Project Structure

```text
Pocket/
 ├── pocket-frontend/
 └── pocket-backend/
```

## Features

- User authentication
- Income tracking
- Expense tracking
- Transaction management
- Category management
- Dashboard analytics
- Responsive UI

## Environment Variables

### Backend

Create:

```text
pocket-backend/.env
```

Example:

```env
NODE_ENV=development

PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=pocket_db

JWT_SECRET=your_secret_here
```

### Frontend

Create:

```text
pocket-frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000
```

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Pocket.git
```

---

### Backend Setup

```bash
cd pocket-backend

npm install
```

Run development server:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd pocket-frontend

npm install
```

Run development server:

```bash
npm run dev
```

## Production Deployment

### Frontend
- Vercel

### Backend
- Railway

### Database
- Railway MySQL

## Git Workflow

```bash
git add .

git commit -m "your message"

git push
```

## Security

- Environment variables are excluded from Git
- Passwords should be hashed
- HTTPS enabled in production
- JWT authentication used

## License

Personal project.

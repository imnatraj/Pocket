import 'dotenv/config';
import { pool } from './pool.js';

const SYSTEM_CATEGORIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Food', icon: 'UtensilsCrossed', color: '24 95% 60%', type: 'expense' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Rent', icon: 'Home', color: '260 75% 65%', type: 'expense' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Transport', icon: 'Car', color: '210 90% 60%', type: 'expense' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Entertainment', icon: 'Film', color: '320 80% 65%', type: 'expense' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Shopping', icon: 'ShoppingBag', color: '350 80% 62%', type: 'expense' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Health', icon: 'HeartPulse', color: '0 80% 60%', type: 'expense' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Bills', icon: 'Receipt', color: '40 90% 55%', type: 'expense' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Salary', icon: 'Briefcase', color: '158 64% 42%', type: 'income' },
  { id: '99999999-9999-9999-9999-999999999999', name: 'Freelance', icon: 'Sparkles', color: '180 70% 45%', type: 'income' },
];

async function seed() {
  console.log('Seeding system categories…');
  for (const cat of SYSTEM_CATEGORIES) {
    await pool.query(
      'INSERT INTO categories (id, user_id, name, type, icon, color) VALUES (?, NULL, ?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), color = VALUES(color)',
      [cat.id, cat.name, cat.type, cat.icon, cat.color]
    );
  }
  console.log('✔ Seed complete');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

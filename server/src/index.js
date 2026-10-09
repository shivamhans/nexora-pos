import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import salesRoutes from './routes/sales.js';
import categoriesRoutes from './routes/categories.js';
import customersRoutes from './routes/customers.js';
import suppliersRoutes from './routes/suppliers.js';
import purchasesRoutes from './routes/purchases.js';
import inventoryRoutes from './routes/inventory.js';
import transactionsRoutes from './routes/transactions.js';

const app = express();
app.use(helmet());
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    const isLocalViteOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || configuredOrigins.includes(origin) || isLocalViteOrigin) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try { await pool.query('SELECT 1'); database = 'connected'; } catch { /* health endpoint reports service state */ }
  res.json({ status: 'ok', service: 'nexora-pos-api', database, time: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message || 'Unexpected server error.' });
});
const port = Number(process.env.PORT || 4001);
app.listen(port, () => console.log(`Nexora POS API listening on http://localhost:${port}`));

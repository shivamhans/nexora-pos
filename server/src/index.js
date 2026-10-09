import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import salesRoutes from './routes/sales.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try { await pool.query('SELECT 1'); database = 'connected'; } catch { /* health endpoint reports service state */ }
  res.json({ status: 'ok', service: 'nexora-pos-api', database, time: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', salesRoutes);
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message || 'Unexpected server error.' });
});
const port = Number(process.env.PORT || 4001);
app.listen(port, () => console.log(`Nexora POS API listening on http://localhost:${port}`));

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { effectivePermissions } from '../middleware/permissions.js';

const router = Router();
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role, permissions: req.user.permissions } });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const [rows] = await pool.execute('SELECT id, name, email, password_hash, role, is_active, permissions_json AS permissionsJson FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('replace-with')) {
      return res.status(500).json({ error: 'Set a secure JWT_SECRET in the server environment before logging in.' });
    }
    await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const token = jwt.sign({ sub: user.id, name: user.name, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: effectivePermissions(user.role, user.permissionsJson) } });
  } catch (error) { next(error); }
});
export default router;

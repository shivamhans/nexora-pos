import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { requireModuleAccessFor } from '../middleware/permissions.js';

const router = Router();
router.use(requireAuth, requireModuleAccessFor(['Point of Sale', 'Customers'], ['Customers']));
const clean = value => value == null ? null : String(value).trim() || null;

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const includeInactive = req.query.includeInactive === '1' && ['Admin', 'Manager'].includes(req.user.role);
    const [customers] = await pool.execute(`
      SELECT c.id, c.name, c.email, c.phone, c.notes, c.is_active AS isActive,
        COUNT(DISTINCT CASE WHEN s.status = 'COMPLETED' THEN s.id END) AS orderCount,
        COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total_amount ELSE 0 END),0) AS totalSpent,
        MAX(CASE WHEN s.status = 'COMPLETED' THEN s.completed_at END) AS lastPurchaseAt
      FROM customers c LEFT JOIN sales s ON s.customer_id = c.id
      WHERE (? = '' OR c.name LIKE ? OR COALESCE(c.email,'') LIKE ? OR COALESCE(c.phone,'') LIKE ?)
        ${includeInactive ? '' : 'AND c.is_active = 1'}
      GROUP BY c.id ORDER BY c.name LIMIT 250
    `, [q, `%${q}%`, `%${q}%`, `%${q}%`]);
    res.json({ customers });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = clean(req.body?.email)?.toLowerCase() || null;
    const phone = clean(req.body?.phone);
    const notes = clean(req.body?.notes);
    if (!name || name.length > 180) return res.status(400).json({ error: 'Customer name is required (max 180 characters).' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    const [r] = await pool.execute('INSERT INTO customers (name, email, phone, notes) VALUES (?, ?, ?, ?)', [name, email, phone, notes]);
    await pool.execute('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, after_json) VALUES (?, ?, ?, ?, ?)', [req.user.sub, 'CUSTOMER_CREATED', 'CUSTOMER', r.insertId, JSON.stringify({ name, email, phone })]);
    res.status(201).json({ customer: { id: r.insertId, name, email, phone, notes, isActive: 1, orderCount: 0, totalSpent: 0 } });
  } catch (error) { next(error); }
});

router.patch('/:id', allowRoles('Admin', 'Manager'), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid customer ID.' });
  const map = { name: 'name', email: 'email', phone: 'phone', notes: 'notes', isActive: 'is_active' };
  const fields = []; const values = [];
  for (const [key, column] of Object.entries(map)) {
    if (!Object.hasOwn(req.body || {}, key)) continue;
    let value = req.body[key];
    if (key === 'isActive') {
      if (![true, false, 0, 1].includes(value)) return res.status(400).json({ error: 'isActive must be a boolean.' });
      value = value ? 1 : 0;
    } else {
      value = clean(value);
      if (key === 'name' && (!value || value.length > 180)) return res.status(400).json({ error: 'Customer name is required (max 180 characters).' });
      if (key === 'email' && value) {
        value = value.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({ error: 'Enter a valid email address.' });
      }
    }
    fields.push(`${column} = ?`); values.push(value);
  }
  if (!fields.length) return res.status(400).json({ error: 'No editable customer fields supplied.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id, name, email, phone, notes, is_active AS isActive FROM customers WHERE id = ? FOR UPDATE', [id]);
    if (!rows[0]) { await connection.rollback(); return res.status(404).json({ error: 'Customer not found.' }); }
    const before = rows[0];
    await connection.execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    const [after] = await connection.execute('SELECT id, name, email, phone, notes, is_active AS isActive FROM customers WHERE id = ?', [id]);
    await connection.execute('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)', [req.user.sub, 'CUSTOMER_UPDATED', 'CUSTOMER', id, JSON.stringify(before), JSON.stringify(after[0])]);
    await connection.commit();
    res.json({ customer: after[0] });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
});

export default router;

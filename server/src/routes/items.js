import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT i.id, i.name, i.sku, i.barcode, i.category_id, c.name AS category,
      i.selling_price, i.avg_cost, i.qty_on_hand, i.reorder_threshold, i.is_active
      FROM items i LEFT JOIN categories c ON c.id = i.category_id WHERE i.is_active = 1 ORDER BY i.name`);
    res.json({ items: rows });
  } catch (error) { next(error); }
});
router.post('/', allowRoles('Admin', 'Manager'), async (req, res, next) => {
  try {
    const { name, sku, categoryId = null, sellingPrice, initialCost = 0, initialQty = 0, reorderThreshold = 5, barcode = null } = req.body || {};
    if (!name?.trim() || !sku?.trim() || !Number.isFinite(Number(sellingPrice)) || Number(sellingPrice) < 0 || Number(initialQty) < 0 || Number(initialCost) < 0) {
      return res.status(400).json({ error: 'Name, SKU, valid price, non-negative cost, and non-negative initial quantity are required.' });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(`INSERT INTO items (name, sku, barcode, category_id, selling_price, avg_cost, qty_on_hand, reorder_threshold, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name.trim(), sku.trim(), barcode, categoryId, Number(sellingPrice), Number(initialCost), Number(initialQty), Number(reorderThreshold), req.user.sub]);
      if (Number(initialQty) > 0) {
        await connection.execute(`INSERT INTO stock_movements (item_id, movement_type, qty_delta, unit_cost_at_time, reason, user_id)
          VALUES (?, 'OPENING_STOCK', ?, ?, 'Opening stock', ?)`, [result.insertId, Number(initialQty), Number(initialCost), req.user.sub]);
      }
      await connection.commit();
      res.status(201).json({ id: result.insertId, name: name.trim(), sku: sku.trim() });
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'SKU or barcode already exists.' });
    next(error);
  }
});
export default router;

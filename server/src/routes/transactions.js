import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const offset = Math.min(100000, Math.max(0, Number.parseInt(req.query.offset, 10) || 0));
    const [sales] = await pool.execute(`
      SELECT s.id, s.receipt_no AS receiptNo, s.status, s.subtotal, s.discount_total AS discountTotal,
        s.tax_total AS taxTotal, s.total_amount AS totalAmount, s.payment_status AS paymentStatus,
        s.negative_stock_override AS negativeStockOverride, s.completed_at AS completedAt,
        c.id AS customerId, COALESCE(c.name, 'Walk-in Customer') AS customer,
        u.name AS cashier, p.method AS paymentMethod, p.amount_received AS amountReceived, p.change_due AS changeDue,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS lineCount,
        (SELECT COALESCE(SUM(si.provisional_cost),0) FROM sale_items si WHERE si.sale_id = s.id) AS provisionalCostLineCount
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      JOIN users u ON u.id = s.cashier_id
      LEFT JOIN payments p ON p.sale_id = s.id
      WHERE (? = '' OR s.receipt_no LIKE ? OR COALESCE(c.name,'Walk-in Customer') LIKE ? OR u.name LIKE ? OR s.status LIKE ?)
      ORDER BY s.completed_at DESC, s.id DESC LIMIT ? OFFSET ?
    `, [q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit, offset]);
    const [counts] = await pool.execute(`
      SELECT COUNT(*) AS total FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id JOIN users u ON u.id = s.cashier_id
      WHERE (? = '' OR s.receipt_no LIKE ? OR COALESCE(c.name,'Walk-in Customer') LIKE ? OR u.name LIKE ? OR s.status LIKE ?)
    `, [q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
    res.json({ transactions: sales, page: { limit, offset, total: Number(counts[0].total) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  const input = String(req.params.id || '').trim();
  if (!input || input.length > 60) return res.status(400).json({ error: 'Invalid transaction identifier.' });
  try {
    const [rows] = await pool.execute(`
      SELECT s.id, s.receipt_no AS receiptNo, s.status, s.subtotal, s.discount_total AS discountTotal,
        s.tax_total AS taxTotal, s.total_amount AS totalAmount, s.payment_status AS paymentStatus,
        s.negative_stock_override AS negativeStockOverride, s.stock_override_reason AS stockOverrideReason,
        s.completed_at AS completedAt, c.id AS customerId, COALESCE(c.name, 'Walk-in Customer') AS customer,
        u.name AS cashier
      FROM sales s LEFT JOIN customers c ON c.id = s.customer_id JOIN users u ON u.id = s.cashier_id
      WHERE s.id = ? OR s.receipt_no = ? LIMIT 1
    `, [Number.isSafeInteger(Number(input)) ? Number(input) : -1, input]);
    if (!rows[0]) return res.status(404).json({ error: 'Transaction not found.' });
    const sale = rows[0];
    const [lines] = await pool.execute(`
      SELECT id AS saleItemId, item_id AS itemId, item_name_snapshot AS itemName,
        sku_snapshot AS sku, quantity, unit_price_actual AS unitPrice,
        unit_cost_snapshot AS unitCostSnapshot, discount_amount AS discountAmount,
        price_override AS priceOverride, override_reason AS overrideReason, provisional_cost AS provisionalCost
      FROM sale_items WHERE sale_id = ? ORDER BY id
    `, [sale.id]);
    const [payments] = await pool.execute(`
      SELECT id, method, amount_received AS amountReceived, change_due AS changeDue,
        reference_no AS referenceNo, paid_at AS paidAt FROM payments WHERE sale_id = ?
    `, [sale.id]);
    res.json({ transaction: { ...sale, lines, payments } });
  } catch (error) { next(error); }
});

export default router;

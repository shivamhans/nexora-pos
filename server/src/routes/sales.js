import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.post('/', async (req, res, next) => {
  const { customerId = null, paymentMethod, amountReceived, referenceNo = null, discountAmount = 0, discountReason = null, lines = [], negativeStockOverride = false, stockOverrideReason = null, idempotencyKey } = req.body || {};
  if (!Array.isArray(lines) || !lines.length) return res.status(400).json({ error: 'Add at least one item to the sale.' });
  if (!['Cash', 'UPI', 'Card'].includes(paymentMethod)) return res.status(400).json({ error: 'Choose a supported payment method.' });
  if (!idempotencyKey || String(idempotencyKey).length > 100) return res.status(400).json({ error: 'A valid idempotency key is required.' });
  if (Number(discountAmount) > 0 && !['Admin', 'Manager'].includes(req.user.role)) return res.status(403).json({ error: 'Only Managers and Admins may apply discounts.' });
  if (Number(discountAmount) > 0 && String(discountReason || '').trim().length < 5) return res.status(400).json({ error: 'A discount reason of at least 5 characters is required.' });
  if (negativeStockOverride && req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin may override negative stock.' });
  if (negativeStockOverride && String(stockOverrideReason || '').trim().length < 5) return res.status(400).json({ error: 'A stock override reason of at least 5 characters is required.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id, receipt_no, total_amount FROM sales WHERE idempotency_key = ? LIMIT 1', [idempotencyKey]);
    if (existing[0]) { await connection.rollback(); return res.status(200).json({ sale: existing[0], duplicate: true }); }
    let subtotal = 0;
    const resolved = [];
    for (const line of lines) {
      const itemId = Number(line.itemId); const qty = Number(line.quantity);
      if (!Number.isInteger(itemId) || !Number.isInteger(qty) || qty < 1) { await connection.rollback(); return res.status(400).json({ error: 'Each sale line requires a valid item and positive whole quantity.' }); }
      const [rows] = await connection.execute('SELECT id, name, sku, selling_price, avg_cost, qty_on_hand FROM items WHERE id = ? AND is_active = 1 FOR UPDATE', [itemId]);
      const item = rows[0];
      if (!item) { await connection.rollback(); return res.status(404).json({ error: `Item ${itemId} was not found.` }); }
      if (qty > item.qty_on_hand && !negativeStockOverride) { await connection.rollback(); return res.status(409).json({ error: `${item.name}: only ${item.qty_on_hand} in stock.`, itemId, available: item.qty_on_hand }); }
      const unitPrice = line.unitPrice === undefined ? Number(item.selling_price) : Number(line.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) { await connection.rollback(); return res.status(400).json({ error: 'Invalid selling price.' }); }
      if (line.unitPrice !== undefined && Math.abs(unitPrice - Number(item.selling_price)) > 0.0001) {
        if (!['Admin', 'Manager'].includes(req.user.role)) { await connection.rollback(); return res.status(403).json({ error: 'Only Managers and Admins may override prices.' }); }
        if (String(line.overrideReason || '').trim().length < 5) { await connection.rollback(); return res.status(400).json({ error: 'Price override reason is required.' }); }
      }
      subtotal += unitPrice * qty;
      resolved.push({ item, qty, unitPrice, lineTotal: unitPrice * qty, overrideReason: line.overrideReason || null });
    }
    const discount = Number(discountAmount || 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) { await connection.rollback(); return res.status(400).json({ error: 'Discount must be between zero and the subtotal.' }); }
    const total = Number((subtotal - discount).toFixed(2));
    const received = paymentMethod === 'Cash' ? Number(amountReceived) : total;
    if (!Number.isFinite(received) || received < total) { await connection.rollback(); return res.status(400).json({ error: 'Full payment is required before completing a sale.' }); }
    const receiptNo = `NX-${Date.now().toString().slice(-8)}-${randomUUID().slice(0,4).toUpperCase()}`;
    const [saleResult] = await connection.execute(`INSERT INTO sales (receipt_no, customer_id, cashier_id, status, subtotal, discount_total, tax_total, total_amount, payment_status, negative_stock_override, stock_override_reason, idempotency_key)
      VALUES (?, ?, ?, 'COMPLETED', ?, ?, 0, ?, 'PAID', ?, ?, ?)`, [receiptNo, customerId, req.user.sub, subtotal, discount, total, negativeStockOverride ? 1 : 0, negativeStockOverride ? stockOverrideReason : null, idempotencyKey]);
    const saleId = saleResult.insertId;
    for (const line of resolved) {
      const [itemRows] = await connection.execute('SELECT qty_on_hand, avg_cost FROM items WHERE id = ? FOR UPDATE', [line.item.id]);
      const current = itemRows[0];
      // v1 guard: if a negative-stock override would need an unknown cost basis, preserve last known WAC as a provisional snapshot.
      const [lineResult] = await connection.execute(`INSERT INTO sale_items (sale_id, item_id, item_name_snapshot, sku_snapshot, quantity, unit_price_actual, unit_cost_snapshot, discount_amount, price_override, override_reason, provisional_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`, [saleId, line.item.id, line.item.name, line.item.sku, line.qty, line.unitPrice, current.avg_cost, line.unitPrice !== Number(line.item.selling_price) ? 1 : 0, line.overrideReason, line.qty > current.qty_on_hand ? 1 : 0]);
      await connection.execute('UPDATE items SET qty_on_hand = qty_on_hand - ? WHERE id = ?', [line.qty, line.item.id]);
      await connection.execute(`INSERT INTO stock_movements (item_id, movement_type, qty_delta, unit_cost_at_time, reference_type, reference_id, reason, user_id)
        VALUES (?, 'SALE', ?, ?, 'SALE', ?, ?, ?)`, [line.item.id, -line.qty, current.avg_cost, saleId, negativeStockOverride && line.qty > current.qty_on_hand ? stockOverrideReason : null, req.user.sub]);
      if (line.unitPrice !== Number(line.item.selling_price)) await connection.execute(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_json, after_json, reason) VALUES (?, 'PRICE_OVERRIDE', 'SALE_ITEM', ?, ?, ?, ?)`, [req.user.sub, lineResult.insertId, JSON.stringify({ sellingPrice: line.item.selling_price }), JSON.stringify({ unitPrice: line.unitPrice }), line.overrideReason]);
    }
    await connection.execute(`INSERT INTO payments (sale_id, method, amount_received, change_due, reference_no) VALUES (?, ?, ?, ?, ?)`, [saleId, paymentMethod.toUpperCase(), received, paymentMethod === 'Cash' ? received - total : 0, referenceNo]);
    if (negativeStockOverride) await connection.execute(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, after_json, reason) VALUES (?, 'NEGATIVE_STOCK_OVERRIDE', 'SALE', ?, ?, ?)`, [req.user.sub, saleId, JSON.stringify({ receiptNo }), stockOverrideReason]);
    if (discount > 0) await connection.execute(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, after_json, reason) VALUES (?, 'DISCOUNT_APPLIED', 'SALE', ?, ?, ?)`, [req.user.sub, saleId, JSON.stringify({ discount }), discountReason]);
    await connection.commit();
    res.status(201).json({ sale: { id: saleId, receiptNo, subtotal, discount, total, paymentMethod, changeDue: paymentMethod === 'Cash' ? received - total : 0 }, message: 'Sale completed.' });
  } catch (error) { await connection.rollback(); if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate sale submission.' }); next(error); }
  finally { connection.release(); }
});
export default router;

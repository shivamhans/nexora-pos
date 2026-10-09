import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
const isoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(String(value) + 'T00:00:00Z'));
const money2 = value => Number(Number(value || 0).toFixed(2));
const dateString = date => date.toISOString().slice(0, 10);

router.get('/summary', async (req, res, next) => {
  try {
    const today = new Date();
    const defaultTo = dateString(today);
    const start = new Date(today); start.setUTCDate(start.getUTCDate() - 6);
    const defaultFrom = dateString(start);
    const from = String(req.query.from || defaultFrom);
    const to = String(req.query.to || defaultTo);
    if (!isoDate(from) || !isoDate(to) || from > to) return res.status(400).json({ error: 'Use valid from/to dates in YYYY-MM-DD format, with from on or before to.' });
    const days = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000 + 1;
    if (days > 366) return res.status(400).json({ error: 'Report range cannot exceed 366 days.' });

    const [saleRows] = await pool.execute(`
      SELECT COUNT(*) AS completedSales, COALESCE(SUM(total_amount),0) AS salesTotal,
        COALESCE(SUM(subtotal),0) AS subtotal, COALESCE(SUM(discount_total),0) AS discountTotal,
        COALESCE(SUM(tax_total),0) AS taxTotal
      FROM sales WHERE status = 'COMPLETED' AND DATE(completed_at) BETWEEN ? AND ?
    `, [from, to]);
    const [returnRows] = await pool.execute(`
      SELECT COUNT(*) AS completedReturns, COALESCE(SUM(refund_total),0) AS refundTotal
      FROM returns WHERE status = 'COMPLETED' AND DATE(completed_at) BETWEEN ? AND ?
    `, [from, to]);
    const [costRows] = await pool.execute(`
      SELECT COALESCE(SUM(si.quantity * si.unit_cost_snapshot),0) AS soldCost,
        COALESCE(SUM(CASE WHEN si.provisional_cost = 1 THEN si.quantity ELSE 0 END),0) AS provisionalQuantity
      FROM sale_items si JOIN sales s ON s.id = si.sale_id
      WHERE s.status = 'COMPLETED' AND DATE(s.completed_at) BETWEEN ? AND ?
    `, [from, to]);
    const [restockRows] = await pool.execute(`
      SELECT COALESCE(SUM(CASE WHEN ri.restock = 1 THEN ri.quantity * si.unit_cost_snapshot ELSE 0 END),0) AS restockedCost,
        COALESCE(SUM(CASE WHEN si.provisional_cost = 1 THEN ri.quantity ELSE 0 END),0) AS provisionalReturnQuantity
      FROM return_items ri JOIN returns r ON r.id = ri.return_id
      JOIN sale_items si ON si.id = ri.sale_item_id
      WHERE r.status = 'COMPLETED' AND DATE(r.completed_at) BETWEEN ? AND ?
    `, [from, to]);
    const [paymentRows] = await pool.execute(`
      SELECT p.method, COUNT(*) AS paymentCount, COALESCE(SUM(s.total_amount),0) AS amount
      FROM payments p JOIN sales s ON s.id = p.sale_id
      WHERE s.status = 'COMPLETED' AND DATE(s.completed_at) BETWEEN ? AND ?
      GROUP BY p.method ORDER BY amount DESC
    `, [from, to]);
    const [inventoryRows] = await pool.execute(`
      SELECT COUNT(*) AS itemCount,
        SUM(CASE WHEN qty_on_hand > 0 AND qty_on_hand <= reorder_threshold THEN 1 ELSE 0 END) AS lowStockCount,
        SUM(CASE WHEN qty_on_hand = 0 THEN 1 ELSE 0 END) AS outOfStockCount,
        SUM(CASE WHEN qty_on_hand < 0 THEN 1 ELSE 0 END) AS negativeStockCount,
        COALESCE(SUM(qty_on_hand * avg_cost),0) AS inventoryCostValue
      FROM items WHERE is_active = 1
    `);
    const [queueRows] = await pool.execute("SELECT COUNT(*) AS openReconciliations FROM negative_stock_reconciliation WHERE status = 'OPEN'");
    const [dailySales] = await pool.execute(`
      SELECT DATE(completed_at) AS day, COALESCE(SUM(total_amount),0) AS amount
      FROM sales WHERE status = 'COMPLETED' AND DATE(completed_at) BETWEEN ? AND ? GROUP BY DATE(completed_at)
    `, [from, to]);
    const [dailyReturns] = await pool.execute(`
      SELECT DATE(completed_at) AS day, COALESCE(SUM(refund_total),0) AS amount
      FROM returns WHERE status = 'COMPLETED' AND DATE(completed_at) BETWEEN ? AND ? GROUP BY DATE(completed_at)
    `, [from, to]);
    const [recent] = await pool.execute(`
      SELECT s.id, s.receipt_no AS receiptNo, s.total_amount AS totalAmount, s.completed_at AS completedAt,
        s.status, COALESCE(c.name, 'Walk-in Customer') AS customer, u.name AS cashier, p.method AS paymentMethod
      FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
      JOIN users u ON u.id = s.cashier_id LEFT JOIN payments p ON p.sale_id = s.id
      ORDER BY s.completed_at DESC LIMIT 8
    `);
    const [settingsRows] = await pool.execute('SELECT currency_code AS currencyCode, currency_symbol AS currencySymbol, locale FROM business_settings WHERE id = 1');
    const sale = saleRows[0], ret = returnRows[0], cost = costRows[0], inventory = inventoryRows[0];
    const netRevenue = money2(Number(sale.salesTotal) - Number(ret.refundTotal));
    const provisionalQuantity = Number(cost.provisionalQuantity || 0) + Number(restockRows[0].provisionalReturnQuantity || 0);
    const cogs = money2(Number(cost.soldCost) - Number(restockRows[0].restockedCost));
    const grossProfit = provisionalQuantity > 0 ? null : money2(netRevenue - cogs);
    const salesByDay = new Map(dailySales.map(row => [dateString(new Date(row.day)), Number(row.amount)]));
    const refundsByDay = new Map(dailyReturns.map(row => [dateString(new Date(row.day)), Number(row.amount)]));
    const daily = [];
    for (let cursor = new Date(from + 'T00:00:00Z'); dateString(cursor) <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const day = dateString(cursor);
      const salesAmount = salesByDay.get(day) || 0;
      const refundAmount = refundsByDay.get(day) || 0;
      daily.push({ day, sales: money2(salesAmount), refunds: money2(refundAmount), netRevenue: money2(salesAmount - refundAmount) });
    }
    res.json({
      period: { from, to, days },
      currency: settingsRows[0] || { currencyCode: 'INR', currencySymbol: '₹' },
      summary: {
        completedSales: Number(sale.completedSales),
        completedReturns: Number(ret.completedReturns),
        salesTotal: money2(sale.salesTotal),
        refundsTotal: money2(ret.refundTotal),
        netRevenue,
        grossProfit,
        grossProfitAvailable: provisionalQuantity === 0,
        provisionalCostQuantity: provisionalQuantity,
        inventoryCostValue: money2(inventory.inventoryCostValue),
        activeItems: Number(inventory.itemCount || 0),
        lowStockCount: Number(inventory.lowStockCount || 0),
        outOfStockCount: Number(inventory.outOfStockCount || 0),
        negativeStockCount: Number(inventory.negativeStockCount || 0),
        openReconciliations: Number(queueRows[0].openReconciliations || 0),
      },
      payments: paymentRows.map(row => ({ method: row.method, paymentCount: Number(row.paymentCount), amount: money2(row.amount) })),
      daily,
      recentTransactions: recent.map(row => ({ ...row, totalAmount: money2(row.totalAmount) })),
      notes: ['Net revenue subtracts refunds completed in the selected period.', 'Gross profit is hidden when sales or restock lines in the period include provisional cost snapshots.', 'Net profit is not reported because an expense module is not present.'],
    });
  } catch (error) { next(error); }
});

export default router;

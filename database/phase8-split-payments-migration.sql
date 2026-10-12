-- Nexora POS Phase 8: allow multiple payment methods on one sale.
-- BACK UP nexora_pos_cg before applying. This only changes the payment index;
-- existing payment rows, sale rows and their amounts are preserved.
USE nexora_pos_cg;

SET @nexora_payments_unique_sale_index = (
  SELECT index_name
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND non_unique = 0
    AND column_name = 'sale_id'
    AND index_name <> 'PRIMARY'
  GROUP BY index_name
  HAVING COUNT(*) = 1
  LIMIT 1
);

SET @nexora_payments_index_sql = IF(
  @nexora_payments_unique_sale_index IS NULL,
  'SELECT ''payments.sale_id already permits multiple rows'' AS migration_status',
  CONCAT(
    'ALTER TABLE payments DROP INDEX `',
    REPLACE(@nexora_payments_unique_sale_index, '`', '``'),
    '`, ADD INDEX idx_payments_sale_id (sale_id)'
  )
);
PREPARE nexora_payments_index_stmt FROM @nexora_payments_index_sql;
EXECUTE nexora_payments_index_stmt;
DEALLOCATE PREPARE nexora_payments_index_stmt;

SET @nexora_has_payments_method_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND index_name = 'idx_payments_method_paid_at'
);
SET @nexora_payments_method_sql = IF(
  @nexora_has_payments_method_index = 0,
  'CREATE INDEX idx_payments_method_paid_at ON payments (method, paid_at)',
  'SELECT ''payments method/date index already exists'' AS migration_status'
);
PREPARE nexora_payments_method_stmt FROM @nexora_payments_method_sql;
EXECUTE nexora_payments_method_stmt;
DEALLOCATE PREPARE nexora_payments_method_stmt;

SELECT 'Phase 8 split-payment migration completed' AS migration_status;

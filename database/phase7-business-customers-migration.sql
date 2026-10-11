-- Nexora POS Phase 7: optional business classification for customers.
-- Back up nexora_pos_cg before running. This migration adds one default-false
-- flag and preserves all existing customer and sales records.
USE nexora_pos_cg;

SET @nexora_has_customer_business = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'customers' AND column_name = 'is_business'
);
SET @nexora_customer_business_sql = IF(
  @nexora_has_customer_business = 0,
  'ALTER TABLE customers ADD COLUMN is_business BOOLEAN NOT NULL DEFAULT FALSE AFTER notes',
  'SELECT ''customers.is_business already exists'' AS migration_status'
);
PREPARE nexora_customer_business_stmt FROM @nexora_customer_business_sql;
EXECUTE nexora_customer_business_stmt;
DEALLOCATE PREPARE nexora_customer_business_stmt;

SELECT 'Phase 7 business-customer migration completed' AS migration_status;

-- Add market price tracking columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS market_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_price_sync TIMESTAMPTZ;

-- Add index for price sync queries
CREATE INDEX IF NOT EXISTS idx_products_last_price_sync ON products(last_price_sync);

COMMENT ON COLUMN products.market_price IS 'Current StockX market price for the product';
COMMENT ON COLUMN products.last_price_sync IS 'Timestamp of the last StockX price sync';

-- Walk-In Purchases: Normalized schema (alternative to purchase_transactions JSONB approach)
-- DO NOT RUN if purchase_transactions already exists and is in use.
-- This provides a normalized two-table structure for walk-in purchases.

-- ============================================================
-- Table: walk_in_purchases
-- Master record for each walk-in purchase transaction
-- ============================================================
CREATE TABLE IF NOT EXISTS walk_in_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  seller_phone TEXT,
  seller_email TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'zelle', 'store_credit')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  staff_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_walk_in_purchases_created_at ON walk_in_purchases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_walk_in_purchases_payment ON walk_in_purchases (payment_method);
CREATE INDEX IF NOT EXISTS idx_walk_in_purchases_seller ON walk_in_purchases USING gin (seller_name gin_trgm_ops);

-- RLS
ALTER TABLE walk_in_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage walk_in_purchases"
  ON walk_in_purchases FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Table: walk_in_purchase_items
-- Individual items within a walk-in purchase
-- ============================================================
CREATE TABLE IF NOT EXISTS walk_in_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES walk_in_purchases(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  size TEXT,
  condition TEXT NOT NULL DEFAULT 'new',
  offer_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  market_value NUMERIC(10,2),
  image_url TEXT,
  added_to_inventory BOOLEAN NOT NULL DEFAULT false,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_walk_in_purchase_items_purchase ON walk_in_purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_walk_in_purchase_items_product ON walk_in_purchase_items (product_id);

-- RLS
ALTER TABLE walk_in_purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage walk_in_purchase_items"
  ON walk_in_purchase_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

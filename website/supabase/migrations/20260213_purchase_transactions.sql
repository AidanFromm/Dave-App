-- Walk-in Purchase Transactions
-- Tracks purchases from walk-in sellers (sneakers, Pokemon cards, etc.)

CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  seller_phone TEXT,
  seller_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'zelle', 'store_credit')),
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching by seller
CREATE INDEX idx_purchase_transactions_seller_name ON purchase_transactions USING gin (seller_name gin_trgm_ops);
CREATE INDEX idx_purchase_transactions_created_at ON purchase_transactions (created_at DESC);
CREATE INDEX idx_purchase_transactions_payment_method ON purchase_transactions (payment_method);

-- RLS
ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) full access
CREATE POLICY "Admins can manage purchase_transactions"
  ON purchase_transactions
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- JSONB items array schema reference:
-- Each item: {
--   description: string,
--   category: "sneaker" | "pokemon_raw" | "pokemon_graded" | "pokemon_sealed",
--   condition: string,
--   size: string | null,           -- for sneakers
--   grade: string | null,          -- for graded cards
--   cert_number: string | null,    -- for graded cards
--   grading_company: string | null,-- PSA, BGS, CGC, etc.
--   offered_price: number,
--   market_price: number | null
-- }

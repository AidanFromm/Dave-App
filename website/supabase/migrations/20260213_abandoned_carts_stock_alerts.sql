-- Abandoned Cart Recovery & Back-in-Stock Notifications
-- Migration: 20260213_abandoned_carts_stock_alerts

-- ─── Abandoned Carts ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC(10,2) DEFAULT 0,
  recovered BOOLEAN NOT NULL DEFAULT false,
  recovery_email_sent_at TIMESTAMPTZ,
  email_1_sent BOOLEAN NOT NULL DEFAULT false,
  email_1_sent_at TIMESTAMPTZ,
  email_2_sent BOOLEAN NOT NULL DEFAULT false,
  email_2_sent_at TIMESTAMPTZ,
  email_3_sent BOOLEAN NOT NULL DEFAULT false,
  email_3_sent_at TIMESTAMPTZ,
  discount_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_recovered ON abandoned_carts(recovered);
CREATE INDEX idx_abandoned_carts_created_at ON abandoned_carts(created_at);

-- RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own abandoned carts"
  ON abandoned_carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own abandoned carts"
  ON abandoned_carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own abandoned carts"
  ON abandoned_carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on abandoned_carts"
  ON abandoned_carts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Stock Alerts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_variant_id ON stock_alerts(variant_id);
CREATE INDEX idx_stock_alerts_email ON stock_alerts(email);
CREATE INDEX idx_stock_alerts_notified ON stock_alerts(notified_at);

-- RLS
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock alerts"
  ON stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock alerts"
  ON stock_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock alerts"
  ON stock_alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on stock_alerts"
  ON stock_alerts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Drops / Release Calendar tables
CREATE TABLE IF NOT EXISTS drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  drop_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update drop_subscribers to reference drops table
-- (existing table may only have email; add drop_id, user_id, notified)
ALTER TABLE drop_subscribers
  ADD COLUMN IF NOT EXISTS drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_drops_date ON drops(drop_date);
CREATE INDEX IF NOT EXISTS idx_drops_active ON drops(is_active);
CREATE INDEX IF NOT EXISTS idx_drop_subscribers_drop ON drop_subscribers(drop_id);

-- RLS
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on drops"
  ON drops FOR ALL USING (true) WITH CHECK (true);

-- Gift Cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  initial_amount NUMERIC(10,2) NOT NULL CHECK (initial_amount > 0),
  remaining_balance NUMERIC(10,2) NOT NULL CHECK (remaining_balance >= 0),
  purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Gift card usage/redemption history
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund', 'manual_adjust')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);

-- RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (admin operations)
CREATE POLICY "Service role full access on gift_cards"
  ON gift_cards FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on gift_card_transactions"
  ON gift_card_transactions FOR ALL USING (true) WITH CHECK (true);

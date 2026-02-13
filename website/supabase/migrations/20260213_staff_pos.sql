-- Staff & POS Migration
-- Run this in Supabase SQL Editor

-- Add role to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'customer'
      CHECK (role IN ('customer', 'owner', 'manager', 'staff'));
  END IF;
END $$;

-- Staff clock entries
CREATE TABLE IF NOT EXISTS staff_clock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  hours NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clock_entries_user ON staff_clock_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_date ON staff_clock_entries(clock_in);

ALTER TABLE staff_clock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own clock entries"
  ON staff_clock_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can insert own clock entries"
  ON staff_clock_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update own clock entries"
  ON staff_clock_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clock entries"
  ON staff_clock_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- POS transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'zelle')),
  staff_id UUID REFERENCES auth.users(id),
  receipt_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_staff ON pos_transactions(staff_id);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view pos transactions"
  ON pos_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Staff can insert pos transactions"
  ON pos_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

-- Staff activity log
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON staff_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON staff_activity_log(created_at);

ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
  ON staff_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Staff can insert activity log"
  ON staff_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

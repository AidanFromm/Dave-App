-- =============================================
-- Secured Tampa — Admin Tables Migration
-- =============================================

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer'
  CHECK (role IN ('customer', 'owner', 'manager', 'staff'));

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Inventory adjustments audit log
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'sold_online', 'sold_instore', 'returned', 'damaged',
    'restocked', 'adjustment', 'transfer'
  )),
  previous_quantity INT,
  new_quantity INT,
  notes TEXT,
  adjusted_by UUID REFERENCES auth.users(id),
  source TEXT CHECK (source IN ('admin', 'clover_webhook', 'web_order')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adj_product ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adj_created ON inventory_adjustments(created_at DESC);

-- 3. Clover integration settings
CREATE TABLE IF NOT EXISTS clover_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  webhook_secret TEXT,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily analytics (materialized/cached)
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  web_orders INT DEFAULT 0,
  instore_orders INT DEFAULT 0,
  web_revenue NUMERIC(10,2) DEFAULT 0,
  instore_revenue NUMERIC(10,2) DEFAULT 0,
  items_sold INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS on new tables
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clover_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND role IN ('owner', 'manager', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check owner role
CREATE OR REPLACE FUNCTION is_owner_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- inventory_adjustments: all admin roles can view and insert
CREATE POLICY "Admin can view inventory adjustments"
  ON inventory_adjustments FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Admin can insert inventory adjustments"
  ON inventory_adjustments FOR INSERT
  WITH CHECK (is_admin_user());

-- clover_settings: owner only
CREATE POLICY "Owner can view clover settings"
  ON clover_settings FOR SELECT
  USING (is_owner_user());

CREATE POLICY "Owner can manage clover settings"
  ON clover_settings FOR ALL
  USING (is_owner_user());

-- daily_analytics: owner can view all, staff limited
CREATE POLICY "Owner can view analytics"
  ON daily_analytics FOR SELECT
  USING (is_owner_user());

-- =============================================
-- Update profiles RLS to allow admin role reads
-- =============================================
-- (Existing policies should already handle profile reads,
--  but add a policy so admins can read other profiles for staff management)
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_owner_user());

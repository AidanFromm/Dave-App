-- Secured App Row Level Security (RLS) Policies
-- Run this AFTER 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_drops ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES POLICIES
-- Public can read active categories
-- ============================================

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Categories are editable by service role"
  ON categories FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- PRODUCTS POLICIES
-- Public can read active products
-- ============================================

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Products are editable by service role"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- CUSTOMERS POLICIES
-- Users can only see/edit their own data
-- ============================================

CREATE POLICY "Users can view own customer profile"
  ON customers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own customer profile"
  ON customers FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own customer profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Service role has full customer access"
  ON customers FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ORDERS POLICIES
-- Users can see their own orders
-- ============================================

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full orders access"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- INVENTORY LOGS POLICIES
-- Only service role (admin) can access
-- ============================================

CREATE POLICY "Inventory logs are admin only"
  ON inventory_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SCHEDULED DROPS POLICIES
-- Public can view upcoming drops
-- ============================================

CREATE POLICY "Drops are viewable by everyone"
  ON scheduled_drops FOR SELECT
  USING (drop_date > NOW());

CREATE POLICY "Drops are editable by service role"
  ON scheduled_drops FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Row Level Security policies applied successfully!';
END $$;

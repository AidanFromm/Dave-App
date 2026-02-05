-- =============================================
-- Secured Tampa — FULL Database Schema
-- =============================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (true);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  size TEXT,
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair')),
  colorway TEXT,
  has_box BOOLEAN DEFAULT true,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2),
  compare_at_price NUMERIC(10,2),
  quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 3,
  images TEXT[] DEFAULT '{}',
  is_drop BOOLEAN DEFAULT false,
  drop_date TIMESTAMPTZ,
  ebay_listing_id TEXT,
  whatnot_listing_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (true);
CREATE POLICY "Service role can manage products" ON products FOR ALL USING (auth.role() = 'service_role');

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_auth ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own customer record" ON customers FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own customer record" ON customers FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Service role can manage customers" ON customers FOR ALL USING (auth.role() = 'service_role');

-- 4. Profiles (linked to auth.users for role-based access)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role can manage profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  sales_channel TEXT DEFAULT 'web' CHECK (sales_channel IN ('pos', 'ios', 'web', 'ebay', 'whatnot', 'in_store')),
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  fulfillment_type TEXT DEFAULT 'ship' CHECK (fulfillment_type IN ('ship', 'pickup')),
  shipping_address JSONB,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  stripe_payment_status TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view orders by email" ON orders FOR SELECT USING (true);
CREATE POLICY "Service role can manage orders" ON orders FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- Admin Tables
-- =============================================

-- 6. Inventory adjustments audit log
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

ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- 7. Clover integration settings
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

ALTER TABLE clover_settings ENABLE ROW LEVEL SECURITY;

-- 8. Daily analytics
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

ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper Functions + Admin RLS Policies
-- =============================================

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND role IN ('owner', 'manager', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_owner_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Admin RLS policies
CREATE POLICY "Admin can view inventory adjustments" ON inventory_adjustments FOR SELECT USING (is_admin_user());
CREATE POLICY "Admin can insert inventory adjustments" ON inventory_adjustments FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "Owner can view clover settings" ON clover_settings FOR SELECT USING (is_owner_user());
CREATE POLICY "Owner can manage clover settings" ON clover_settings FOR ALL USING (is_owner_user());
CREATE POLICY "Owner can view analytics" ON daily_analytics FOR SELECT USING (is_owner_user());
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (is_owner_user());

-- Admin can manage products (insert/update/delete)
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (is_admin_user());
-- Admin can view all orders
CREATE POLICY "Admin can view all orders" ON orders FOR SELECT USING (is_admin_user());
-- Admin can update orders
CREATE POLICY "Admin can update orders" ON orders FOR UPDATE USING (is_admin_user());
-- Admin can view all customers
CREATE POLICY "Admin can view all customers" ON customers FOR SELECT USING (is_admin_user());

-- =============================================
-- Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

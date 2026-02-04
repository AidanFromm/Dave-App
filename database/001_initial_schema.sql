-- Secured App Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE product_condition AS ENUM ('new', 'used_like_new', 'used_good', 'used_fair');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE sales_channel AS ENUM ('pos', 'ios', 'web', 'ebay', 'whatnot');
CREATE TYPE fulfillment_type AS ENUM ('ship', 'pickup');

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('New Sneakers', 'new-sneakers', 1),
  ('Used Sneakers', 'used-sneakers', 2),
  ('Pokemon', 'pokemon', 3);

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE,
  barcode VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Product specifics
  brand VARCHAR(100),
  size VARCHAR(20),
  condition product_condition DEFAULT 'new',
  colorway VARCHAR(100),
  has_box BOOLEAN DEFAULT true,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),

  -- Inventory
  quantity INT DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INT DEFAULT 5,

  -- Images (JSON array of URLs)
  images JSONB DEFAULT '[]'::jsonb,

  -- Product drops
  is_drop BOOLEAN DEFAULT false,
  drop_date TIMESTAMPTZ,

  -- External listings
  ebay_listing_id VARCHAR(100),
  whatnot_listing_id VARCHAR(100),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_drop_date ON products(drop_date) WHERE is_drop = true;

-- ============================================
-- CUSTOMERS TABLE
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- Links to Supabase Auth

  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Addresses (JSON array)
  addresses JSONB DEFAULT '[]'::jsonb,
  default_address_index INT DEFAULT 0,

  -- Preferences
  push_token TEXT,
  size_alerts JSONB DEFAULT '[]'::jsonb, -- Array of {size: "10", category_id: "..."}
  marketing_opt_in BOOLEAN DEFAULT false,

  -- Stats
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) NOT NULL UNIQUE,

  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,

  -- Channel tracking
  channel sales_channel NOT NULL,

  -- Order items (JSON array)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each item: {product_id, name, sku, size, quantity, price, total}

  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Status
  status order_status DEFAULT 'pending',

  -- Fulfillment
  fulfillment_type fulfillment_type DEFAULT 'ship',
  shipping_address JSONB,
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Payment
  stripe_payment_id VARCHAR(255),
  stripe_payment_status VARCHAR(50),

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- INVENTORY LOGS TABLE (Audit Trail)
-- ============================================

CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  quantity_before INT NOT NULL,
  quantity_change INT NOT NULL,
  quantity_after INT NOT NULL,

  channel sales_channel,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reason VARCHAR(255),

  created_by UUID, -- User who made the change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created ON inventory_logs(created_at DESC);

-- ============================================
-- SCHEDULED DROPS TABLE
-- ============================================

CREATE TABLE scheduled_drops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  drop_date TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drops_date ON scheduled_drops(drop_date);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'SEC-' || TO_CHAR(NOW(), 'YYMMDD') || '-' ||
         LPAD(COALESCE(
           (SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::TEXT,
           '1'
         ), 4, '0')
  INTO new_number;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INVENTORY DEDUCTION FUNCTION (CRITICAL)
-- ============================================

CREATE OR REPLACE FUNCTION deduct_inventory(
  p_product_id UUID,
  p_quantity INT,
  p_channel sales_channel,
  p_order_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'Order placed'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty INT;
BEGIN
  -- Lock the row and get current quantity
  SELECT quantity INTO v_current_qty
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Check if enough stock
  IF v_current_qty IS NULL OR v_current_qty < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Deduct inventory
  UPDATE products
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id;

  -- Log the transaction
  INSERT INTO inventory_logs (product_id, quantity_before, quantity_change, quantity_after, channel, order_id, reason)
  VALUES (p_product_id, v_current_qty, -p_quantity, v_current_qty - p_quantity, p_channel, p_order_id, p_reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INVENTORY RESTORE FUNCTION (For cancellations)
-- ============================================

CREATE OR REPLACE FUNCTION restore_inventory(
  p_product_id UUID,
  p_quantity INT,
  p_channel sales_channel,
  p_order_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'Order cancelled'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty INT;
BEGIN
  SELECT quantity INTO v_current_qty
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_qty IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Restore inventory
  UPDATE products
  SET quantity = quantity + p_quantity
  WHERE id = p_product_id;

  -- Log the transaction
  INSERT INTO inventory_logs (product_id, quantity_before, quantity_change, quantity_after, channel, order_id, reason)
  VALUES (p_product_id, v_current_qty, p_quantity, v_current_qty + p_quantity, p_channel, p_order_id, p_reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables: categories, products, customers, orders, inventory_logs, scheduled_drops';
  RAISE NOTICE 'Functions: deduct_inventory, restore_inventory, generate_order_number';
END $$;

# Dave App (SecuredTampa) — Manual Setup Guide

Everything that needs to be done manually in Supabase / Vercel after all code is pushed.

---

## 1. SQL Migrations (Run in Supabase SQL Editor)

Run these **in order** in the Supabase SQL Editor for project `wupfvvwypyvzkznekksw`.

### Pre-requisite: Enable pg_trgm extension
Some migrations use `gin_trgm_ops` for fuzzy text search. Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Migration 1: Orders RLS + Inventory Fixes
File: `supabase/migrations/005_fix_orders_rls_and_inventory.sql`
- Restricts customers to only see their own orders
- Allows service_role to manage orders (for Stripe webhook)
- Fixes inventory_adjustments source constraint
```sql
-- Fix 1: Orders RLS
DROP POLICY IF EXISTS "Users can view orders by email" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    customer_email = (auth.jwt() ->> 'email')
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');
ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_source_check;
ALTER TABLE inventory_adjustments ADD CONSTRAINT inventory_adjustments_source_check 
  CHECK (source IN ('admin', 'clover_webhook', 'web_order', 'stripe_webhook'));
ALTER TABLE inventory_adjustments ALTER COLUMN adjusted_by DROP NOT NULL;
CREATE POLICY "Service role can manage inventory_adjustments" ON inventory_adjustments
  FOR ALL USING (auth.role() = 'service_role');
```

### Migration 2: Product Variants
File: `supabase/migrations/product_variants.sql`
- Creates `product_variants` table (size/condition/SKU/barcode per product)
- Adds `has_variants` boolean to products table
```sql
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  condition TEXT NOT NULL DEFAULT 'DS' CHECK (condition IN ('DS', 'VNDS', 'Used-Excellent', 'Used-Good', 'Used-Fair')),
  sku TEXT UNIQUE,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  clover_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;
```

### Migration 3: Pokemon Card Details
File: `supabase/migrations/20260213_pokemon_card_details.sql`
- Creates `pokemon_card_details` table (raw/graded/sealed cards)
- Indexes, RLS, updated_at trigger
```sql
CREATE TABLE IF NOT EXISTS pokemon_card_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('raw', 'graded', 'sealed')),
  name TEXT NOT NULL,
  set_name TEXT,
  card_number TEXT,
  rarity TEXT,
  condition TEXT CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'DMG', NULL)),
  grading_company TEXT CHECK (grading_company IN ('PSA', 'BGS', 'CGC', NULL)),
  grade NUMERIC(3,1) CHECK (grade >= 1 AND grade <= 10),
  cert_number TEXT,
  sealed_type TEXT,
  image_url TEXT,
  price_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  tcgplayer_price NUMERIC(10,2),
  last_price_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pokemon_card_type ON pokemon_card_details(card_type);
CREATE INDEX idx_pokemon_product_id ON pokemon_card_details(product_id);
CREATE INDEX idx_pokemon_set_name ON pokemon_card_details(set_name);
CREATE INDEX idx_pokemon_created_at ON pokemon_card_details(created_at DESC);
ALTER TABLE pokemon_card_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pokemon cards" ON pokemon_card_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION update_pokemon_card_details_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER pokemon_card_details_updated_at BEFORE UPDATE ON pokemon_card_details FOR EACH ROW EXECUTE FUNCTION update_pokemon_card_details_updated_at();
```

### Migration 4: Shipping Columns (GoShippo)
File: `supabase/migrations/20260213_add_shipping_columns.sql`
- Adds shipping label, carrier, rate, Shippo IDs, tracking columns to orders
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shippo_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shippo_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_history JSONB DEFAULT '[]'::jsonb;
```

### Migration 5: Refunds + Pickup Columns
File: `supabase/migrations/add-refunds-pickup.sql` (check exact filename)
- Adds delivery_method, pickup_status, refund columns, customer_phone to orders
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'shipping';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
```

### Migration 6: Walk-in Purchase Transactions
File: `supabase/migrations/20260213_purchase_transactions.sql`
- Creates `purchase_transactions` table (JSONB items approach)
- **Requires pg_trgm extension** (run pre-requisite above first)
```sql
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
CREATE INDEX idx_purchase_transactions_seller_name ON purchase_transactions USING gin (seller_name gin_trgm_ops);
CREATE INDEX idx_purchase_transactions_created_at ON purchase_transactions (created_at DESC);
CREATE INDEX idx_purchase_transactions_payment_method ON purchase_transactions (payment_method);
ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage purchase_transactions" ON purchase_transactions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
```

### Migration 7: Staff Clock + POS + Activity Log
File: `supabase/migrations/20260213_staff_pos.sql`
- Adds `role` column to profiles (if missing)
- Creates `staff_clock_entries`, `pos_transactions`, `staff_activity_log` tables
```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'manager', 'staff'));
  END IF;
END $$;

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
CREATE POLICY "Staff can view own clock entries" ON staff_clock_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can insert own clock entries" ON staff_clock_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update own clock entries" ON staff_clock_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all clock entries" ON staff_clock_entries FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')));

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
CREATE POLICY "Staff can view pos transactions" ON pos_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager', 'staff')));
CREATE POLICY "Staff can insert pos transactions" ON pos_transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager', 'staff')));

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
CREATE POLICY "Admins can view activity log" ON staff_activity_log FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')));
CREATE POLICY "Staff can insert activity log" ON staff_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 2. Vercel Environment Variables

Make sure these are set in Vercel (project: SecuredTampa / Dave-App):

| Variable | Description | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Should exist |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Should exist |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin API routes) | Should exist |
| `STRIPE_SECRET_KEY` | Stripe secret key | Should exist |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Should exist |
| `NEXT_PUBLIC_SITE_URL` | `https://securedtampa.com` | Should exist |
| `RESEND_API_KEY` | `re_PCuyV26A_K9S4PfewFKG2VCoiGpKe78CG` | **Verify set** |
| `SHIPPO_API_KEY` | GoShippo API key | **NEEDS ADDING** (get from Dave) |
| `TWILIO_ACCOUNT_SID` | Twilio SID for SMS | **Verify set** |
| `TWILIO_AUTH_TOKEN` | Twilio auth token for SMS | **Verify set** |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | **Verify set** |

---

## 3. Stripe Webhook

Ensure the Stripe webhook at `https://securedtampa.com/api/webhooks/stripe` is configured to send:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `charge.refunded`

---

## 4. GoShippo Setup

1. Create a GoShippo account at https://goshippo.com
2. Get API key from GoShippo dashboard
3. Add as `SHIPPO_API_KEY` in Vercel env vars
4. Set up tracking webhook URL: `https://securedtampa.com/api/admin/shipping/webhook`

---

## 5. Roles Setup

After running migrations, set Dave as owner in Supabase:
```sql
UPDATE profiles SET role = 'owner' WHERE email = 'dave@securedtampa.com';
-- Replace with Dave's actual email
```

Set Aidan and Kyle as managers:
```sql
UPDATE profiles SET role = 'manager' WHERE email IN ('aidan@email.com', 'kyle@email.com');
-- Replace with actual emails
```

---

## 6. Clover POS (Pending)

Waiting for Dave to send Clover login credentials. Once received:
1. Create Clover developer account
2. Get API key + merchant ID
3. Add to Vercel env vars
4. Webhook sync will auto-sync inventory

---

## 7. Sentry Error Tracking

1. Create a Sentry account at https://sentry.io
2. Create a Next.js project
3. Get the DSN
4. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env vars
5. Sentry is already wired into the app — will start capturing errors immediately

---

## 8. Uptime Monitoring

The app has a `/api/health` endpoint. Set up a free uptime monitor:
- **UptimeRobot** (free) or **Better Uptime** — monitor `https://securedtampa.com/api/health`
- Alert via email/SMS when site goes down

---

### Migration 8: Inventory Reconciliations
File: `supabase/migrations/20260213_inventory_reconciliations.sql`
- Creates `inventory_reconciliations` table for daily count verification
```sql
-- Run the contents of supabase/migrations/20260213_inventory_reconciliations.sql
```

### Migration 9: Market Price Columns (StockX Sync)
File: `supabase/migrations/20260213_market_price_columns.sql`
- Adds `market_price` and `last_price_sync` columns to products table
```sql
-- Run the contents of supabase/migrations/20260213_market_price_columns.sql
```

---

## Summary Checklist

- [ ] Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` in SQL Editor
- [ ] Run Migration 1 (Orders RLS)
- [ ] Run Migration 2 (Product Variants)
- [ ] Run Migration 3 (Pokemon Card Details)
- [ ] Run Migration 4 (Shipping Columns)
- [ ] Run Migration 5 (Refunds + Pickup)
- [ ] Run Migration 6 (Walk-in Purchases)
- [ ] Run Migration 7 (Staff + POS)
- [ ] Run Migration 8 (Inventory Reconciliations)
- [ ] Run Migration 9 (Market Price Columns)
- [ ] Verify Vercel env vars (RESEND_API_KEY, SHIPPO_API_KEY, NEXT_PUBLIC_SENTRY_DSN)
- [ ] Set user roles (owner/manager) in profiles table
- [ ] Set up GoShippo account + webhook
- [ ] Set up Sentry project + add DSN
- [ ] Set up uptime monitoring on /api/health
- [ ] Get Clover credentials from Dave

-- Pokemon Card Details table
-- Stores detailed information for Pokemon card inventory (raw, graded, sealed)

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

-- Indexes
CREATE INDEX idx_pokemon_card_type ON pokemon_card_details(card_type);
CREATE INDEX idx_pokemon_product_id ON pokemon_card_details(product_id);
CREATE INDEX idx_pokemon_set_name ON pokemon_card_details(set_name);
CREATE INDEX idx_pokemon_created_at ON pokemon_card_details(created_at DESC);

-- Enable RLS
ALTER TABLE pokemon_card_details ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin check done at API level)
CREATE POLICY "Authenticated users can manage pokemon cards"
  ON pokemon_card_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pokemon_card_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pokemon_card_details_updated_at
  BEFORE UPDATE ON pokemon_card_details
  FOR EACH ROW
  EXECUTE FUNCTION update_pokemon_card_details_updated_at();

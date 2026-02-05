CREATE TABLE IF NOT EXISTS stockx_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stockx_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read stockx_tokens"
  ON stockx_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

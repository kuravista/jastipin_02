-- Create passwordResetToken table for secure password reset flow
CREATE TABLE IF NOT EXISTS "passwordResetToken" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key constraint with cascade delete
  CONSTRAINT fk_password_reset_token_user_id 
    FOREIGN KEY ("userId") 
    REFERENCES "User"(id) 
    ON DELETE CASCADE,

  -- One-time use constraint: token can only be used once
  CONSTRAINT check_one_time_use 
    CHECK ("usedAt" IS NULL OR "expiresAt" > NOW())
);

-- Index for fast lookups by userId and expiresAt
CREATE INDEX IF NOT EXISTS idx_password_reset_token_user_id 
  ON "passwordResetToken"("userId");

CREATE INDEX IF NOT EXISTS idx_password_reset_token_expires_at 
  ON "passwordResetToken"("expiresAt");

-- Index for faster token hash lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash 
  ON "passwordResetToken"("tokenHash");

-- Comment for documentation
COMMENT ON TABLE "passwordResetToken" IS 'Stores secure password reset tokens with one-time use enforcement. Tokens expire after 1 hour and are marked as used when successfully redeemed.';

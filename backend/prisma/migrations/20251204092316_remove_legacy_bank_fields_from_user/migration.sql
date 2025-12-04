-- Remove legacy bank account fields from User table
-- These fields are now managed via the BankAccount model
ALTER TABLE "User" DROP COLUMN IF EXISTS "bankName";
ALTER TABLE "User" DROP COLUMN IF EXISTS "accountNumber";
ALTER TABLE "User" DROP COLUMN IF EXISTS "accountHolderName";

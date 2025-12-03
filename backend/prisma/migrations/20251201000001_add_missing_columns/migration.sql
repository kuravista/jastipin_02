-- Add missing User columns (origin address + contact info)
ALTER TABLE "User" ADD COLUMN "coverPosition" INTEGER DEFAULT 50;
ALTER TABLE "User" ADD COLUMN "originAddressText" TEXT;
ALTER TABLE "User" ADD COLUMN "originCityId" TEXT;
ALTER TABLE "User" ADD COLUMN "originCityName" TEXT;
ALTER TABLE "User" ADD COLUMN "originDistrictId" TEXT;
ALTER TABLE "User" ADD COLUMN "originDistrictName" TEXT;
ALTER TABLE "User" ADD COLUMN "originPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN "originProvinceId" TEXT;
ALTER TABLE "User" ADD COLUMN "originProvinceName" TEXT;
ALTER TABLE "User" ADD COLUMN "originRajaOngkirDistrictId" TEXT;
ALTER TABLE "User" ADD COLUMN "accountHolderName" TEXT;
ALTER TABLE "User" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "bankName" TEXT;
ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT;

-- Add missing Trip columns
ALTER TABLE "Trip" ADD COLUMN "paymentType" TEXT NOT NULL DEFAULT 'full';
ALTER TABLE "Trip" ADD COLUMN "dpPercentage" INTEGER NOT NULL DEFAULT 20;

-- Add missing Product columns
ALTER TABLE "Product" ADD COLUMN "isUnlimitedStock" BOOLEAN NOT NULL DEFAULT false;

-- Add missing Order columns
ALTER TABLE "Order" ADD COLUMN "orderCode" TEXT UNIQUE;
ALTER TABLE "Order" ADD COLUMN "guestId" TEXT;
ALTER TABLE "Order" ADD COLUMN "dpProofUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "finalProofUrl" TEXT;

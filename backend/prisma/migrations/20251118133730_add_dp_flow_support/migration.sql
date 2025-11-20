-- CreateTable: Address (with wilayah.id structure)
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "provinceName" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "villageId" TEXT,
    "villageName" TEXT,
    "postalCode" TEXT,
    "rajaOngkirDistrictId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrderItem (multiple products per order)
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "priceAtOrder" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "itemSubtotal" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeesConfig (global fee configuration)
CREATE TABLE "FeesConfig" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "meta" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeesConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Product (add product type fields)
ALTER TABLE "Product" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'goods';
ALTER TABLE "Product" ADD COLUMN "unit" TEXT;
ALTER TABLE "Product" ADD COLUMN "weightGram" INTEGER;
ALTER TABLE "Product" ADD COLUMN "requiresDetails" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "requiresProof" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "markupType" TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE "Product" ADD COLUMN "markupValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ALTER COLUMN "stock" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable: Order (add DP flow fields)
ALTER TABLE "Order" ADD COLUMN "tripId" TEXT;
ALTER TABLE "Order" ADD COLUMN "addressId" TEXT;
ALTER TABLE "Order" ADD COLUMN "dpAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "dpPaidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "dpPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "finalAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN "finalPaidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "finalPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "finalBreakdown" JSONB;
ALTER TABLE "Order" ADD COLUMN "shippingFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "serviceFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "platformCommission" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "validatedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "validatedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'pending_dp';
ALTER TABLE "Order" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "totalPrice" SET DEFAULT 0;
ALTER TABLE "Order" ALTER COLUMN "notes" SET DATA TYPE TEXT;

-- AlterTable: Participant (add index)
-- No structural changes, just adding index later

-- CreateIndex
CREATE INDEX "Address_participantId_idx" ON "Address"("participantId");
CREATE INDEX "Address_provinceId_idx" ON "Address"("provinceId");
CREATE INDEX "Address_cityId_idx" ON "Address"("cityId");
CREATE INDEX "Address_districtId_idx" ON "Address"("districtId");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE UNIQUE INDEX "FeesConfig_scope_calculationType_key" ON "FeesConfig"("scope", "calculationType");
CREATE INDEX "FeesConfig_scope_idx" ON "FeesConfig"("scope");

CREATE INDEX "Participant_phone_idx" ON "Participant"("phone");

CREATE INDEX "Product_type_idx" ON "Product"("type");
CREATE INDEX "Product_status_idx" ON "Product"("status");

CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_tripId_idx" ON "Order"("tripId");
CREATE INDEX "Order_dpPaidAt_idx" ON "Order"("dpPaidAt");
CREATE INDEX "Order_validatedAt_idx" ON "Order"("validatedAt");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
